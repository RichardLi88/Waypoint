"use client";

import { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  registerables,
} from "chart.js";
import useAxios from "../hooks/useAxios";
import { ChartOptions } from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type User = {
  _id: number;
  name: string;
  username: string;
  role: "admin" | "developer";
};

type UserProductivityGraphProps = {
  users: User[];
};

type WorklogData = {
  date: Date;
  workTime: number;
};

type Priority = "low" | "medium" | "high" | "critical";
type TaskStatus = "completed" | "in_progress" | "not_started";

type Change<T> = {
  to: T;
  from: T;
};

type TaskHistoryItem = {
  _id: number;
  type: "work_log" | "update" | "comment" | "creation";
  createdAt: Date;
  userRef: number; // User
  comment?: string;
  workTime?: Date;
  changes?: {
    name?: Change<string>;
    description?: Change<string>;
    assignees?: Change<number[]>; // Change<User[]>
    weight?: Change<number>;
    priority?: Change<Priority>;
    tags?: Change<string[]>;
    status?: Change<TaskStatus>;
  };
};

export function UserProductivityGraph({ users }: UserProductivityGraphProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [worklogData, setWorklogData] = useState<WorklogData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasChanged, setHasChanged] = useState(false);
  const Axios = useAxios();

  const fetchWorklogs = async () => {
    if (!selectedUser || !startDate || !endDate) {
      setError("Please select a user and date range");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      setError("Start date must be before end date");
      return;
    }

    try {
      const response = await Axios.get(
        `/api/users/${selectedUser.username}/worklogs`,
        {
          params: {
            startDate: start,
            endDate: end,
          },
        }
      );

      setWorklogData(
        response.data.map((log: TaskHistoryItem) => ({
          date: new Date(log.createdAt),
          workTime: log.workTime,
        }))
      );

      setError(null);
    } catch {
      setError("Failed to fetch worklogs. Please try again.");
    }
  };

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const getDateRange = (start: Date, end: Date): Date[] => {
    const dateArray = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      dateArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateArray;
  };

  const aggregatedWorklogData: Record<string, number> = worklogData.reduce(
    (acc, { date, workTime }) => {
      const dateString = formatDate(date);
      acc[dateString] = (acc[dateString] || 0) + workTime;
      return acc;
    },
    {} as Record<string, number>
  );

  const allDates = getDateRange(new Date(startDate), new Date(endDate));

  ChartJS.register(...registerables);

  const chartData = {
    labels: allDates.map((date) => formatDate(date)),
    datasets: [
      {
        label: "Hours Worked",
        data: allDates.map(
          (date) =>
            (aggregatedWorklogData[formatDate(date)] || 0) / (3600 * 1000)
        ),
        fill: false,
        backgroundColor: "rgb(75, 192, 192)",
        borderColor: "rgba(75, 192, 192, 0.2)",
        pointBackgroundColor: allDates.map((date) => {
          const workTime = aggregatedWorklogData[formatDate(date)] || 0;
          return workTime > 24 * 3600 * 1000 ? "red" : "rgb(75, 192, 192)";
        }),
      },
    ],
  };

  const weekendHighlightPlugin = {
    id: "weekendHighlight",
    beforeDraw: (
      chart: ChartJS,
      _args: ChartOptions,
      options: { dates: Date[] }
    ) => {
      const {
        ctx,
        chartArea: { right, top, bottom },
        scales: { x },
      } = chart;

      ctx.save();

      const dates =
        options.dates ||
        chart.data.labels?.map((label) => new Date(label as string)) ||
        [];

      dates.forEach((date, index) => {
        const currentDate = date instanceof Date ? date : new Date(date);
        const day = currentDate.getDay();
        if (day === 0 || day === 6) {
          const startX = x.getPixelForValue(index);
          let endX;

          if (index < dates.length - 1) {
            endX = x.getPixelForValue(index + 1);
          } else {
            endX = right;
          }

          ctx.fillStyle = "rgba(200, 200, 200, 0.3)";
          ctx.fillRect(startX, top, endX - startX, bottom - top);
        }
      });
      ctx.restore();
    },
  };

  ChartJS.register(weekendHighlightPlugin);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "User Productivity",
      },
      weekendHighlight: {
        dates: allDates,
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date",
          font: {
            weight: "bold" as const,
          },
        },
      },
      y: {
        title: {
          display: true,
          text: "Hours",
          font: {
            weight: "bold" as const,
          },
        },
      },
    },
  };

  const calculateWorkInfo = () => {
    const totalDays = allDates.length;
    const weekdays = allDates.filter(date => ![0, 6].includes(date.getDay())).length;
    const totalWorkTime = Object.values(aggregatedWorklogData).reduce((sum, time) => sum + time, 0);
    const averageTimeWorked = totalWorkTime / weekdays / (3600 * 1000); // Convert to hours

    return {
      totalDays,
      weekdays,
      averageTimeWorked: averageTimeWorked.toFixed(2),
      totalWorkTime: (totalWorkTime / (3600 * 1000)).toFixed(2),
    };
  };

  const workInfo = calculateWorkInfo();

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <select
          className="px-3 py-2 border rounded md:flex-auto mt-8 mr-0 md:mr-8"
          onChange={(e) =>
            setSelectedUser(
              users.find((u) => u.username === e.target.value) || null
            )
          }
          value={selectedUser?.name ?? ""}
        >
          <option value="" disabled>Select user</option>
          {users.map((user) => (
            <option key={user._id} value={user.username}>
              {user.name}
            </option>
          ))}
        </select>
        <div className="flex md:flex-row flex-col md:flex-auto md:mt-8">
          <label className="my-2 mt-2 mr-1">Start Date</label>
          <input
            type="date"
            className="px-3 py-2 border rounded w-full md:w-[80%]"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setHasChanged(true);
            }}
          />
        </div>
        <div className="flex md:flex-row flex-col md:flex-auto md:mt-8">
          <label className="my-2 mt-2 mr-1">End Date</label>
          <input
            type="date"
            className="px-3 py-2 border rounded w-full md:w-[80%]"
            value={endDate}
            onChange={(e) => {
              setHasChanged(true);
              setEndDate(e.target.value);
            }}
          />
        </div>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 md:mt-8"
          onClick={() => {
            setHasChanged(false)
            fetchWorklogs()
          }}
        >
          Generate Report
        </button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {(!error && new Date(startDate) < new Date(endDate) && !hasChanged) && (
        <>
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Work Summary</h2>
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b">Metric</th>
                  <th className="py-2 px-4 border-b">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-4 border-b">Total Days</td>
                  <td className="py-2 px-4 border-b">{workInfo.totalDays}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b">Weekdays</td>
                  <td className="py-2 px-4 border-b">{workInfo.weekdays}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b">Average Time Worked (hours/weekday)</td>
                  <td className="py-2 px-4 border-b">{workInfo.averageTimeWorked}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border-b">Total Work Time (hours)</td>
                  <td className="py-2 px-4 border-b">{workInfo.totalWorkTime}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="min-h-[600px]">
            <Line data={chartData} options={options} />
          </div>
        </>
      )}
    </div>
  );
}