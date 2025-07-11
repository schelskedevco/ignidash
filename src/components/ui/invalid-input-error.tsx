import { XCircleIcon } from "@heroicons/react/20/solid";

export interface InvalidInputErrorProps {
  title: string;
  description?: string;
}

export default function InvalidInputError({
  title,
  description,
}: InvalidInputErrorProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
      <div className="flex">
        <div className="shrink-0">
          <XCircleIcon
            aria-hidden="true"
            className="size-5 text-red-400 dark:text-red-500"
          />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            {title}
          </h3>
          {description && (
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
