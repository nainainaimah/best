'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

type PostNowButtonProps = {
  caption: string;
};

export default function PostNowButton({ caption }: PostNowButtonProps) {
  const t = useTranslations();
  const [showModal, setShowModal] = useState(false);

  const handlePostNow = async () => {
    try {
      await navigator.clipboard.writeText(caption);

      const instagramUrl = 'instagram://camera';
      window.location.href = instagramUrl;

      setTimeout(() => {
        setShowModal(true);
      }, 1000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      setShowModal(true);
    }
  };

  return (
    <>
      <button onClick={handlePostNow} className="btn btn-primary">
        {t('post.postNow')}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Post to Instagram</h3>
            <p className="mb-4">
              Your caption has been copied to clipboard!
            </p>
            <p className="mb-6 text-gray-600">
              If Instagram didn't open automatically, please open the Instagram app manually and paste your caption.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="btn btn-primary w-full"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
