export default function ButtonGroup() {
  return (
    <span className="isolate inline-flex w-full rounded-md shadow-xs">
      <button
        type="button"
        className="bg-emphasized-background ring-border hover:bg-background relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset focus:z-10"
      >
        Years
      </button>
      <button
        type="button"
        className="bg-emphasized-background ring-border hover:bg-background relative -ml-px inline-flex items-center px-3 py-2 text-sm font-semibold ring-1 ring-inset focus:z-10"
      >
        Months
      </button>
      <button
        type="button"
        className="bg-emphasized-background ring-border hover:bg-background relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset focus:z-10"
      >
        Days
      </button>
    </span>
  );
}
