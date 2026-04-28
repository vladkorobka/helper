'use client';

const Bar = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

const HEIGHTS = {
  input: 'h-10',
  textarea: 'h-24',
  'textarea-sm': 'h-16',
  pills: 'h-8',
  tall: 'h-16',
};

function Field({ type = 'input', labelWidth = 'w-20' }) {
  return (
    <div className="space-y-1.5">
      <Bar className={`${labelWidth} h-4`} />
      <Bar className={`w-full ${HEIGHTS[type] || HEIGHTS.input}`} />
    </div>
  );
}

const GRID = {
  1: '',
  2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  3: 'grid grid-cols-1 md:grid-cols-3 gap-4',
  4: 'grid grid-cols-1 md:grid-cols-4 gap-4',
};

export default function FormPageSkeleton({
  rows = [
    { cols: 2 },
    { cols: 1 },
    { cols: 1, type: 'textarea' },
  ],
  maxWidth = 'max-w-3xl',
  withHeader = true,
  withFooter = true,
  scrollable = false,
}) {
  const bodyClass = `p-6 space-y-4 ${
    scrollable ? 'max-h-[calc(100vh-280px)] overflow-y-auto' : ''
  }`;

  return (
    <div className={`${maxWidth} mx-auto`}>
      <div className="card">
        {withHeader && (
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <Bar className="w-36 h-5" />
            <Bar className="w-28 h-6 rounded-full" />
          </div>
        )}

        <div className={bodyClass}>
          {rows.map((row, i) => {
            const cols = row.cols || 1;
            const fields = Array.from({ length: cols }, (_, j) => (
              <Field key={j} type={row.type} />
            ));
            return (
              <div key={i} className={GRID[cols] || ''}>
                {cols === 1 ? fields[0] : fields}
              </div>
            );
          })}
        </div>

        {withFooter && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
            <Bar className="w-20 h-9" />
            <Bar className="w-20 h-9" />
          </div>
        )}
      </div>
    </div>
  );
}
