import "@/styles/globals.css";
import { createGlobalStyle } from 'styled-components';
import { ErikaMonoFont } from '../components/main/styles';
import { useEffect } from 'react';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'G2ErikaMono-Medium', monospace;
  }
`;

export default function App({ Component, pageProps }) {
  return (
    <>
      <GlobalStyle />
      <ErikaMonoFont />
      <Component {...pageProps} />
    </>
  );
}
