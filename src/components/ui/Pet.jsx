import { useEffect, useState } from 'react';

import { Box } from 'ink';

import { petEvents } from '../../utils/petEvents';
import { PixelSprite } from './PixelSprite';
import { Toast } from './Toast';

export function Pet({ ref, theme }) {
  const [toastMessage, setToastMessage] = useState({});
  const [messagesQueue, setMessagesQueue] = useState([]);

  useEffect(() => {
    function handleToast(message, messageId) {
      setMessagesQueue((previousQueue) => [...previousQueue, { message, messageId }]);
    }

    petEvents.on('toast', handleToast);

    return () => {
      petEvents.off('toast', handleToast);
    };
  }, []);

  useEffect(() => {
    const firstMessage = messagesQueue[0] || {};
    setToastMessage(firstMessage);
  }, [messagesQueue]);

  const handleToastFinish = () => {
    petEvents.emit('toastFinished', toastMessage.messageId);

    setMessagesQueue((previousQueue) => previousQueue.slice(1));
  }

  return (
    <Box ref={ref} flexDirection="row" justifyContent="flex-end" alignItems="flex-end">
      {toastMessage && (
        <Toast
          key={toastMessage.messageId}
          theme={theme}
          message={toastMessage.message}
          onFinish={handleToastFinish}
        />
      )}

      <PixelSprite height={2} width={4} assetId={33} theme={theme} />
    </Box>
  );
}
