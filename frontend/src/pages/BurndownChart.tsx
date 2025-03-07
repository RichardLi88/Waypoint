import React from "react";
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
} from "chart.js";

type TaskStatus = "completed" | "in_progress" | "not_started";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface BurndownChartProps {
  sprintData: {
    title: string;
    startDate: Date;
    endDate: Date;
    items: {
      status: TaskStatus;
      storyPoints: number;
      completedAt: Date | null;
    }[];
  };
}

const BurndownChart: React.FC<BurndownChartProps> = ({ sprintData }) => {
  if (!sprintData) {
    return <div>No sprint data available</div>;
  }

  const totalStoryPoints = sprintData.items.reduce((acc, item) => {
    return acc + item.storyPoints;
  }, 0);

  const daysBetween = (date1: Date, date2: Date): number => {
    const diffTime = date2.getTime() - date1.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const startDate = new Date(sprintData.startDate);
  const endDate = new Date(sprintData.endDate);
  const daysInSprint = daysBetween(startDate, endDate);

  const idealBurndown = Array.from(
    { length: daysInSprint },
    (_, i) => totalStoryPoints - (totalStoryPoints / (daysInSprint - 1)) * i,
  );

  const actualBurndown = Array(daysInSprint).fill(totalStoryPoints);
  const completedPerDay = Array(daysInSprint).fill(0);

  sprintData.items
    .filter((item) => item.status === "completed")
    .forEach((task) => {
      const taskDate = new Date(task.completedAt as Date);
      const daysSinceStart = daysBetween(startDate, taskDate);

      if (daysSinceStart <= daysInSprint) {
        completedPerDay[daysSinceStart] += task.storyPoints;
      }
    });

  actualBurndown[0] -= completedPerDay[0];

  for (let i = 1; i <= daysInSprint; i++) {
    actualBurndown[i] = actualBurndown[i - 1] - completedPerDay[i];
  }

  const labels = Array.from({ length: daysInSprint }, (_, i) => {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    return currentDate.toLocaleDateString();
  });

  const today = new Date();
  const daysElapsed = daysBetween(startDate, today);

  const filteredActualBurndown = actualBurndown.slice(0, daysElapsed + 1);

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Ideal Burndown",
        data: idealBurndown,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderDash: [5, 5],
        pointRadius: 0,
      },
      {
        label: "Actual Burndown",
        data: filteredActualBurndown,
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Sprint Burndown Chart",
        font: {
          weight: "bold" as const,
          size: 20,
        },
        color: "black",
      },
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
        ticks: {
          maxRotation: 45, // slanted
          minRotation: 45, // slanted
          autoSkip: true,
        },
      },
      y: {
        title: {
          display: true,
          text: "Story Points",
          font: {
            weight: "bold" as const,
          },
        },
      },
    },
  };

  return <Line options={options} data={data}/>;
};

export default BurndownChart;
