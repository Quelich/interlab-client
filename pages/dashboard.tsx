import { useRouter } from "next/router";
import { Container, Grid, Text, Card, Spacer, Button } from "@nextui-org/react";
import useSWR from "swr";
import CPULineGraph from "@/components/cpu-line-graph";
import CPUMetricsTable from "@/components/cpu-metrics-table";
import CurrentSystemInfo from "@/components/current-system-info";
import React from "react";
import { CPU_Records } from "@prisma/client";
import { prisma } from "@/database/db";
import Link from "next/link";

const os = require("os");

// API endpoint for CPU metrics
const MONITOR_API_ENDPOINT = "/api/v1/monitor/cpu/monitor";

//TODO: handle system shutdown and restart
export async function getServerSideProps() {
  const fetchedCpuRecords: CPU_Records = await prisma.CPU_Records.findUnique({
    where: {
      hostname: os.hostname(),
    },
  });

  const cpuAnalytics = fetchedCpuRecords?.metrics;
  const cpuDates = fetchedCpuRecords?.dates;

  return {
    props: {
      cpuAnalytics: cpuAnalytics,
      cpuDates: cpuDates,
    },
  };
}

// Fetch whole data from API
const fetcher = async (path: string) => {
  const res = await fetch(path);
  return res.json();
};

// Fetch CPU metrics from API and handle errors for the current system
const getCpuMetricsFromAPI = () => {
  const { data } = useSWR(MONITOR_API_ENDPOINT, fetcher);

  try {
    const platform = data.platform;
    const arch = data.arch;
    const cpus = data.cpus;
    const totalmem = data.totalmem;
    const freemem = data.freemem;
    const hostname = data.hostname;
    const uptime = data.uptime;
    return {
      platform,
      arch,
      cpus,
      totalmem,
      freemem,
      hostname,
      uptime,
    };
  } catch (error) {
    console.log(error);
  }
};

// Display the system details of the current system
export default function SystemDetails({ cpuAnalytics, cpuDates }: any) {
  const cpuMetrics = getCpuMetricsFromAPI();

  const router = useRouter();
  const hostname = router.query.hostname;

  // handle undefined cpuMetrics
  return (
    <>
      <h1>Dashboard {hostname}</h1>
      <Grid.Container gap={2} justify="center">
        <Grid xs={12} md={6}>
          <Card variant="bordered">
            <Card.Header>
              <Text h3>CPU Analytics</Text>
            </Card.Header>
            <Card.Body>
              <CPULineGraph cpuAnalytics={cpuAnalytics} cpuDates={cpuDates} />
              <CPUMetricsTable
                cpuAnalytics={cpuAnalytics}
                cpuDates={cpuDates}
              />
            </Card.Body>
            <Card.Footer>
              <Link color={"primary"} href={"/"}>
                See details {">"}
              </Link>
            </Card.Footer>
          </Card>
        </Grid>
        <Grid xs={12} md={6}>
          <Card variant="bordered">
            <Card.Header>
              <Text h3>Disk Analytics</Text>
            </Card.Header>
            <Card.Body></Card.Body>
            <Card.Footer>
              <Link color={"primary"} href={"/"}>
                See details {">"}
              </Link>
            </Card.Footer>
          </Card>
        </Grid>
        <Grid xs={12} md={6}>
          <Card variant="bordered">
            <Card.Header>
              <Text h3>System Information</Text>
            </Card.Header>
            <Card.Body>
              <CurrentSystemInfo cpuMetrics={cpuMetrics} />
            </Card.Body>
            <Card.Footer>
              <Link color={"primary"} href={"/"}>
                See details {">"}
              </Link>
            </Card.Footer>
          </Card>
        </Grid>
      </Grid.Container>
    </>
  );
}
