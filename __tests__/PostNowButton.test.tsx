import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import PostNowButton from '@/components/PostNowButton';
import { NextIntlClientProvider } from 'next-intl';

const messages = {
  post: {
    postNow: 'Post Now',
  },
};

describe('PostNowButton', () => {
  const mockCaption = 'Test caption for Instagram';

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  it('renders correctly', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PostNowButton caption={mockCaption} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText('Post Now')).toBeInTheDocument();
  });

  it('copies caption to clipboard when clicked', async () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PostNowButton caption={mockCaption} />
      </NextIntlClientProvider>
    );

    const button = screen.getByText('Post Now');
    fireEvent.click(button);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockCaption);
  });

  it('attempts to open Instagram deep link', async () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PostNowButton caption={mockCaption} />
      </NextIntlClientProvider>
    );

    const button = screen.getByText('Post Now');
    fireEvent.click(button);

    await waitFor(() => {
      expect(window.location.href).toBe('instagram://camera');
    });
  });

  it('shows modal after timeout', async () => {
    jest.useFakeTimers();

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PostNowButton caption={mockCaption} />
      </NextIntlClientProvider>
    );

    const button = screen.getByText('Post Now');

    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve(); // Flush promises
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/Your caption has been copied/i)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('closes modal when button is clicked', async () => {
    jest.useFakeTimers();

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <PostNowButton caption={mockCaption} />
      </NextIntlClientProvider>
    );

    const button = screen.getByText('Post Now');

    await act(async () => {
      fireEvent.click(button);
      await Promise.resolve(); // Flush promises
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/Your caption has been copied/i)).toBeInTheDocument();

    const closeButton = screen.getByText('Got it!');
    fireEvent.click(closeButton);

    expect(screen.queryByText(/Your caption has been copied/i)).not.toBeInTheDocument();

    jest.useRealTimers();
  });
});
