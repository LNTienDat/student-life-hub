export default function DataLoadError({ message, onRetry }) {
  return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
    <p>{message}</p>
    <button type="button" onClick={onRetry} className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-rose-200 bg-white px-4 font-semibold text-rose-700 hover:bg-rose-50">Thử tải lại</button>
  </div>;
}
