import React from 'react';
import NextErrorComponent from 'next/error';

const CustomErrorComponent = ({ statusCode }) => {
  // You can add your own custom error handling logic or UI here
  // For example, logging the error to an external service
  console.error('Error page rendered with status code:', statusCode);

  return <NextErrorComponent statusCode={statusCode} />;
};

CustomErrorComponent.getInitialProps = async (context) => {
  const errorInitialProps = await NextErrorComponent.getInitialProps(context);

  // You can add additional props here, for example, by fetching data
  return { ...errorInitialProps };
};

export default CustomErrorComponent; 