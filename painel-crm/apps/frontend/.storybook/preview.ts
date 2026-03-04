import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f172a' },
        { name: 'light', value: '#f8fafc' },
      ],
    },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
