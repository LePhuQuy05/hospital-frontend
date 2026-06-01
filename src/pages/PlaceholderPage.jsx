const PlaceholderPage = ({ title }) => {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-3 text-sm text-slate-500">Nội dung trang này sẽ được hoàn thiện trong các bước tiếp theo.</p>
    </div>
  );
};

export default PlaceholderPage;
