import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import LanguageToggle from '@/components/LanguageToggle';
import { NextIntlClientProvider } from 'next-intl';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  usePathname: jest.fn(),
}));

const messages = {
  common: {
    language: 'Language',
  },
};

describe('LanguageToggle', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/en/dashboard');
  });

  it('renders correctly with English locale', () => {
    (useParams as jest.Mock).mockReturnValue({ locale: 'en' });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LanguageToggle />
      </NextIntlClientProvider>
    );

    expect(screen.getByText('🇬🇧 EN')).toBeInTheDocument();
  });

  it('renders correctly with Swahili locale', () => {
    (useParams as jest.Mock).mockReturnValue({ locale: 'swa' });

    render(
      <NextIntlClientProvider locale="swa" messages={messages}>
        <LanguageToggle />
      </NextIntlClientProvider>
    );

    expect(screen.getByText('🇹🇿 SWA')).toBeInTheDocument();
  });

  it('toggles from English to Swahili', () => {
    (useParams as jest.Mock).mockReturnValue({ locale: 'en' });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <LanguageToggle />
      </NextIntlClientProvider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith('/swa/dashboard');
  });

  it('toggles from Swahili to English', () => {
    (useParams as jest.Mock).mockReturnValue({ locale: 'swa' });
    (usePathname as jest.Mock).mockReturnValue('/swa/dashboard');

    render(
      <NextIntlClientProvider locale="swa" messages={messages}>
        <LanguageToggle />
      </NextIntlClientProvider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith('/en/dashboard');
  });
});
