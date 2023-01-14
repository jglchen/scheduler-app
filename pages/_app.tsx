import '@/styles/globals.css';
import 'react-calendar/dist/Calendar.css';
import '@/styles/calendar.css';
import '@wojtekmaj/react-datetimerange-picker/dist/DateTimeRangePicker.css';
import 'react-clock/dist/Clock.css';
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
