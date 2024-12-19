
import { EventSourceParserStream } from 'eventsource-parser/stream';
import { useState, useRef, useCallback } from 'react';
import { baseUrl } from './ragflow';
import { Reference } from '@/types/ragflow';
import useRagflowToken from '@/hooks/useRagflowToken';

export interface ResponseType<T = any> {
  code: number;
  data: T;
  message: string;
  status: number;
}

export interface ResponseGetType<T = any> {
  data: T;
  loading?: boolean;
}

export interface ResponsePostType<T = any> {
  data: T;
  loading?: boolean;
  [key: string]: unknown;
}


export interface IAnswer {
  answer: string;
  reference: Reference;
  conversationId?: string;
  prompt?: string;
  id?: string;
  session_id?: string;
  audio_binary?: string;
}

export const useSendMessageWithSse = (
  appId: string,
) => {
  const url = `${baseUrl}/api/v1/chats/${appId}/completions`
  const [answer, setAnswer] = useState<IAnswer>({} as IAnswer);
  const [done, setDone] = useState(true);
  const timer = useRef<any>();

  const resetAnswer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      setAnswer({} as IAnswer);
      clearTimeout(timer.current);
    }, 1000);
  }, []);

  const send = useCallback(
    async (
      body: any,
      controller?: AbortController,
    ): Promise<{ response: Response; data: ResponseType } | undefined> => {
      try {
        setDone(false);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: useRagflowToken() || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...body,
            stream: true,
          }),
          signal: controller?.signal,
        });

        const res = response.clone().json();

        const reader = response?.body
          ?.pipeThrough(new TextDecoderStream())
          .pipeThrough(new EventSourceParserStream())
          .getReader();

        while (true) {
          const x = await reader?.read();
          if (x) {
            const { done, value } = x;
            if (done) {
              console.info('done');
              resetAnswer();
              break;
            }
            try {
              const val = JSON.parse(value?.data || '');
              const d = val?.data;
              if (typeof d !== 'boolean') {
                console.info('data:', d);
                setAnswer({
                  ...d,
                  conversationId: body?.conversation_id,
                });
              }
            } catch (e) {
              console.warn(e);
            }
          }
        }
        console.info('done?');
        setDone(true);
        resetAnswer();
        return { data: await res, response };
      } catch (e) {
        setDone(true);
        resetAnswer();

        console.warn(e);
      }
    },
    [url, resetAnswer],
  );

  return { send, answer, done, setDone, resetAnswer };
};