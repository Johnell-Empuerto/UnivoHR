const ErrorMessage = ({ message }: { message: string }) => {
  return <div className="text-red-500 text-center p-4">{message}</div>;
};

export default ErrorMessage;
