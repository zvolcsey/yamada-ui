import { useTheme } from "@yamada-ui/core"
import type { CSSUIObject, CSSUIProps } from "@yamada-ui/core"
import { cx, type Dict } from "@yamada-ui/utils"
import type { ComponentPropsWithoutRef } from "react"
import { useCallback, useMemo } from "react"
import type * as Recharts from "recharts"
import { getComponentProps } from "./chart-utils"
import type {
  ChartPropGetter,
  RadarChartProps,
  RadarProps,
  RequiredChartPropGetter,
} from "./chart.types"
import {
  dotProperties,
  radarChartProperties,
  radarProperties,
} from "./rechart-properties"

export type UseRadarChartOptions = {
  /**
   * Chart data.
   */
  data: Dict[]
  /**
   * An array of objects with `dataKey` and `color` keys. Determines which data should be consumed from the `data` array.
   */
  series: RadarProps[]
  /**
   * Props for the radar.
   */
  radarProps?: Partial<RadarProps>
  /**
   * Props passed down to recharts `RadarChart` component.
   */
  radarChartProps?: RadarChartProps
  /**
   * Determines whether dots should be displayed.
   *
   * @default false
   */
  withDots?: boolean
  /**
   * Determines whether activeDots should be displayed.
   *
   * @default true
   */
  withActiveDots?: boolean
  /**
   * Stroke width for the chart lines.
   *
   * @default 2
   */
  strokeWidth?: number
  /**
   * Controls fill opacity of all radars.
   *
   * @default 1
   */
  fillOpacity?: number | [number, number]
}

type UseRadarChartProps = UseRadarChartOptions & {
  styles: Dict<CSSUIObject>
}

export const useRadarChart = ({
  data,
  series,
  withDots = false,
  withActiveDots = false,
  strokeWidth = 2,
  fillOpacity = 1,
  styles,
  ...rest
}: UseRadarChartProps) => {
  const { theme } = useTheme()
  const {
    dot = {},
    activeDot = {},
    ...computedRadarProps
  } = rest.radarProps ?? {}

  const radarColors: CSSUIProps["var"] = useMemo(
    () =>
      series.map(({ color }, index) => ({
        __prefix: "ui",
        name: `radar-${index}`,
        token: "colors",
        value: color ?? "transparent",
      })),
    [series],
  )

  const radarVars: CSSUIProps["var"] = useMemo(
    () => [
      ...radarColors,
      { __prefix: "ui", name: "fill-opacity", value: fillOpacity },
    ],
    [fillOpacity, radarColors],
  )

  const [radarChartProps, radarChartClassName] = useMemo(
    () =>
      getComponentProps<Dict, string>(
        [rest.radarChartProps ?? {}, radarChartProperties],
        styles.radarChart,
      )(theme),
    [rest.radarChartProps, styles.radarChart, theme],
  )

  const [radarProps, radarClassName] = useMemo(() => {
    const resolvedRadarProps = {
      fillOpacity: "var(--ui-fill-opacity)",
      ...computedRadarProps,
    }

    return getComponentProps<Dict, string>(
      [resolvedRadarProps, radarProperties],
      styles.radar,
    )(theme)
  }, [computedRadarProps, styles.radar, theme])

  const [dotProps, dotClassName] = useMemo(() => {
    const resolvedDot = { fillOpacity: 1, strokeOpacity: 1, ...dot }

    return getComponentProps<Dict, string>(
      [resolvedDot, dotProperties],
      styles.dot,
    )(theme)
  }, [dot, styles.dot, theme])

  const [activeDotProps, activeDotClassName] = useMemo(
    () =>
      getComponentProps<Dict, string>(
        [activeDot, dotProperties],
        styles.activeDot,
      )(theme),
    [activeDot, styles.activeDot, theme],
  )

  const radarPropList = useMemo(
    () =>
      series.map((props, index) => {
        const { dataKey, dot = {}, activeDot = {}, ...computedProps } = props
        const color = `var(--ui-radar-${index})`
        const resolvedProps = {
          ...radarProps,
          ...computedProps,
        }

        const rest = getComponentProps<Dict, string>(
          [resolvedProps, radarProperties],
          radarClassName,
        )(theme, true)

        let resolvedActiveDot: Recharts.DotProps | boolean

        if (withActiveDots) {
          const computedActiveDot = {
            ...activeDotProps,
            ...activeDot,
          }

          const [rest, className] = getComponentProps<Dict, string>(
            [computedActiveDot, dotProperties],
            activeDotClassName,
          )(theme)

          resolvedActiveDot = {
            className: cx("ui-radar-chart__active-dot", className),
            fill: color,
            stroke: color,
            r: 4,
            ...rest,
          } as Recharts.DotProps
        } else {
          resolvedActiveDot = false
        }

        let resolvedDot: Recharts.DotProps | boolean

        if (withDots) {
          const computedDot = {
            ...dotProps,
            ...dot,
          }

          const [rest, className] = getComponentProps(
            [computedDot, dotProperties],
            dotClassName,
          )(theme)

          resolvedDot = {
            className: cx("ui-radar-chart__dot", className),
            fill: color,
            ...rest,
          } as Recharts.DotProps
        } else {
          resolvedDot = false
        }

        return {
          ...rest,
          color,
          dataKey,
          dot: resolvedDot,
          activeDot: resolvedActiveDot,
        }
      }),
    [
      activeDotClassName,
      activeDotProps,
      dotClassName,
      dotProps,
      radarClassName,
      radarProps,
      series,
      theme,
      withActiveDots,
      withDots,
    ],
  )

  const getRadarChartProps: ChartPropGetter<
    "div",
    ComponentPropsWithoutRef<typeof Recharts.RadarChart>,
    ComponentPropsWithoutRef<typeof Recharts.RadarChart>
  > = useCallback(
    ({ className, ...props } = {}, ref = null) => ({
      ref,
      className: cx(className, radarChartClassName),
      data,
      ...props,
      ...radarChartProps,
    }),
    [data, radarChartClassName, radarChartProps],
  )

  const getRadarProps: RequiredChartPropGetter<
    "div",
    { index: number },
    Omit<Recharts.RadarProps, "ref">
  > = useCallback(
    ({ index, className: classNameProp, ...props }, ref = null) => {
      const { color, className, dataKey, activeDot, dot, ...rest } =
        radarPropList[index]

      return {
        ref,
        className: cx(classNameProp, className),
        activeDot,
        dot,
        name: dataKey as string,
        dataKey,
        fill: color,
        strokeWidth,
        stroke: color,
        isAnimationActive: false,
        ...(props as Omit<Recharts.RadarProps, "dataKey">),
        ...rest,
      }
    },
    [radarPropList, strokeWidth],
  )

  return { radarVars, getRadarChartProps, getRadarProps }
}

export type UseRadarChartReturn = ReturnType<typeof useRadarChart>
