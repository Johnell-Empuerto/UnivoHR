const EmptyState = ({ message }: { message: string }) => {
  return (
    <div className="text-center text-gray-500 p-10">
      {message || "No data found"}
    </div>
  );
};

export default EmptyState;
