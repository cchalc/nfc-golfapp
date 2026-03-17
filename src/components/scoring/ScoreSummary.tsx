import { Flex, Text, Card, Grid } from '@radix-ui/themes'

interface ScoreSummaryProps {
  totalGross: number
  totalNet: number
  totalStableford: number
  coursePar: number
  birdiesOrBetter?: number
}

export function ScoreSummary({
  totalGross,
  totalNet,
  totalStableford,
  coursePar,
  birdiesOrBetter = 0,
}: ScoreSummaryProps) {
  const grossToPar = totalGross - coursePar
  const netToPar = totalNet - coursePar

  function formatToPar(diff: number): string {
    if (diff === 0) return 'E'
    return diff > 0 ? `+${diff}` : `${diff}`
  }

  return (
    <Card>
      <Grid columns="4" gap="3">
        <Flex direction="column" align="center">
          <Text size="1" color="gray">
            Gross
          </Text>
          <Text size="5" weight="bold">
            {totalGross}
          </Text>
          <Text size="1" color="gray">
            {formatToPar(grossToPar)}
          </Text>
        </Flex>

        <Flex direction="column" align="center">
          <Text size="1" color="gray">
            Net
          </Text>
          <Text size="5" weight="bold">
            {totalNet}
          </Text>
          <Text size="1" color="gray">
            {formatToPar(netToPar)}
          </Text>
        </Flex>

        <Flex direction="column" align="center">
          <Text size="1" color="gray">
            Stableford
          </Text>
          <Text size="5" weight="bold" color="blue">
            {totalStableford}
          </Text>
          <Text size="1" color="gray">
            pts
          </Text>
        </Flex>

        <Flex direction="column" align="center">
          <Text size="1" color="gray">
            Birdies
          </Text>
          <Text size="5" weight="bold" color="green">
            {birdiesOrBetter}
          </Text>
          <Text size="1" color="gray">
            or better
          </Text>
        </Flex>
      </Grid>
    </Card>
  )
}
