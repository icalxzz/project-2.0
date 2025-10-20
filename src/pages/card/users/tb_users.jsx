import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#34D399", "#FBBF24", "#EF4444", "#60A5FA", "#A78BFA"];

const StatistikCard = ({ statistik }) => {
  // pastikan data array, kalau tidak -> kosong
  const data = Array.isArray(statistik) ? statistik : [];

  // hitung total
  const totalHadir =
    data.length > 0 ? data.reduce((sum, s) => sum + s.value, 0) : 0;

  return (
    <div className="p-8 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-lg">
      <h2 className="text-2xl font-semibold text-white mb-4">
        Statistik Kehadiran
      </h2>

      {data.length > 0 ? (
        <>
          {/* Chart */}
          <div className="h-64 mb-6 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${value} (${((value / totalHadir) * 100).toFixed(1)}%)`,
                    name,
                  ]}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Detail */}
          {totalHadir > 0 && (
            <div className="mb-6 space-y-1 text-purple-200">
              {data.map((s, idx) => (
                <p key={idx}>
                  <span className="font-semibold text-white">{s.name}:</span>{" "}
                  {s.value} kali (
                  {((s.value / totalHadir) * 100).toFixed(1)}
                  %)
                </p>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-purple-200">❌ Belum ada data kehadiran.</p>
      )}
    </div>
  );
};

export default StatistikCard;
