"use client";

import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

type PageLoadingStateProperties = {
  showKpiSkeletons?: boolean;
};

export function PageLoadingState({
  showKpiSkeletons = false
}: PageLoadingStateProperties) {
  return (
    <Stack spacing={3}>
      {showKpiSkeletons ? (
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))"
            }
          }}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <Box key={index}>
              <Card>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Skeleton variant="text" width="45%" />
                    <Skeleton variant="text" width="60%" height={40} />
                    <Skeleton variant="text" width="80%" />
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      ) : null}

      <Card sx={{ p: 2.5 }}>
        <Skeleton variant="rounded" height={88} />
      </Card>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 2fr) minmax(0, 1fr)"
          }
        }}
      >
        <Box>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Skeleton variant="text" width="35%" />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="rounded" height={320} />
              </Stack>
            </CardContent>
          </Card>
        </Box>
        <Box>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Skeleton variant="text" width="45%" />
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="rounded" height={320} />
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Stack>
  );
}
