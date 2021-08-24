import { max } from 'd3-array'
import { scaleBand, scaleLinear } from 'd3-scale'
import PropTypes from 'prop-types'
import React, { useState } from 'react'
import { withSize } from 'react-sizeme'
import styled from 'styled-components'
import { AxisBottom, AxisLeft } from '@vx/axis'

import { Select, TooltipAnchor } from '@gnomad/ui'

import { GNOMAD_POPULATION_NAMES } from '@gnomad/dataset-metadata/gnomadPopulations'

import { ShortTandemRepeatVariantPropType } from './ShortTandemRepeatPropTypes'

// The 100% width/height container is necessary the component
// to size to fit its container vs staying at its initial size.
const GraphWrapper = styled.div`
  overflow: hidden;
  width: 100%;
  height: 100%; /* stylelint-disable-line unit-whitelist */
`

const TooltipTrigger = styled.rect`
  pointer-events: visible;

  &:hover {
    fill: rgba(0, 0, 0, 0.05);
  }
`

const tickFormat = n => {
  if (n >= 1e9) {
    return `${(n / 1e9).toPrecision(3)}B`
  }
  if (n >= 1e6) {
    return `${(n / 1e6).toPrecision(3)}M`
  }
  if (n >= 1e3) {
    return `${(n / 1e3).toPrecision(3)}K`
  }
  return `${n}`
}

const margin = {
  bottom: 50,
  left: 60,
  right: 10,
  top: 10,
}

const labelProps = {
  fontSize: 14,
  textAnchor: 'middle',
}

const ShortTandemRepeatRepeatCountsPlot = withSize()(
  ({ maxRepeats, repeats, size: { width }, thresholds }) => {
    const height = 250

    const data = Array.from(Array(maxRepeats + 1).keys()).map(n => ({
      repeat: n,
      count: 0,
    }))

    repeats.forEach(([repeatCount, nAlleles]) => {
      data[repeatCount].count = nAlleles
    })

    const xScale = scaleBand()
      .domain(data.map(d => d.repeat))
      .range([0, width - (margin.left + margin.right)])

    const yScale = scaleLinear()
      .domain([0, max(data, d => d.count) || 1])
      .range([height - (margin.top + margin.bottom), margin.top])

    const maxNumLabels = Math.floor((width - (margin.left + margin.right)) / 20)

    const labelInterval = Math.max(Math.round(maxRepeats / maxNumLabels), 1)

    return (
      <GraphWrapper>
        <svg height={height} width={width}>
          <AxisBottom
            label="Repeats"
            labelProps={labelProps}
            left={margin.left}
            scale={xScale}
            stroke="#333"
            tickFormat={(repeat, i) => (i % labelInterval === 0 ? repeat.toString() : '')}
            top={height - margin.bottom}
          />
          <AxisLeft
            label="Alleles"
            labelProps={labelProps}
            left={margin.left}
            scale={yScale}
            stroke="#333"
            tickFormat={tickFormat}
            top={margin.top}
          />
          <g transform={`translate(${margin.left},${margin.top})`}>
            {data.map(d => (
              <React.Fragment key={`${d.repeat}`}>
                <rect
                  x={xScale(d.repeat)}
                  y={yScale(d.count)}
                  height={yScale(0) - yScale(d.count)}
                  width={xScale.bandwidth()}
                  fill="#73ab3d"
                  stroke="#333"
                />
                <TooltipAnchor
                  tooltip={`${d.repeat} repeat${
                    d.repeat === 1 ? '' : 's'
                  }: ${d.count.toLocaleString()} allele${d.count === 1 ? '' : 's'}`}
                >
                  <TooltipTrigger
                    x={xScale(d.repeat)}
                    y={yScale.range()[1]}
                    height={yScale.range()[0] - yScale.range()[1]}
                    width={xScale.bandwidth()}
                    fill="none"
                    style={{ pointerEvents: 'visible' }}
                  />
                </TooltipAnchor>
              </React.Fragment>
            ))}
          </g>

          <g transform={`translate(${margin.left}, 0)`}>
            {
              thresholds
                .filter(threshold => threshold.value <= maxRepeats)
                .sort((t1, t2) => t2.value - t1.value)
                .reduce(
                  (acc, threshold) => {
                    const labelWidth = 100

                    const thresholdX = xScale(threshold.value)

                    const labelAnchor = thresholdX >= labelWidth ? 'end' : 'start'

                    const yOffset =
                      thresholdX <= acc.previousX - labelWidth ? 0 : acc.previousYOffset + 12

                    const element = (
                      <g key={threshold.label}>
                        <line
                          x1={thresholdX}
                          y1={yOffset + 2}
                          x2={thresholdX}
                          y2={height - margin.bottom}
                          stroke="#333"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={thresholdX}
                          y={yOffset}
                          dx={labelAnchor === 'end' ? -5 : 5}
                          dy="0.75em"
                          fill="#000"
                          fontSize={10}
                          textAnchor={labelAnchor}
                        >
                          {threshold.label}
                        </text>
                      </g>
                    )

                    return {
                      previousX: thresholdX,
                      previousYOffset: yOffset,
                      elements: [element, ...acc.elements],
                    }
                  },
                  {
                    previousX: Infinity,
                    previousYOffset: 0,
                    elements: [],
                  }
                ).elements
            }
          </g>
        </svg>
      </GraphWrapper>
    )
  }
)

ShortTandemRepeatRepeatCountsPlot.displayName = 'ShortTandemRepeatRepeatCountsPlot'

ShortTandemRepeatRepeatCountsPlot.propTypes = {
  maxRepeats: PropTypes.number.isRequired,
  repeats: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
  thresholds: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ),
}

ShortTandemRepeatRepeatCountsPlot.defaultProps = {
  thresholds: [],
}

const populationName = populationId => {
  if (populationId === 'XX' || populationId === 'XY') {
    return populationId
  }

  if (populationId.includes('_')) {
    const [ancestry, sex] = populationId.split('_')
    return `${GNOMAD_POPULATION_NAMES[ancestry]} (${sex})`
  }

  return GNOMAD_POPULATION_NAMES[populationId]
}

const ShortTandemRepeatRepeatCounts = ({ shortTandemRepeatVariant, thresholds }) => {
  const [selectedPopulation, setSelectedPopulation] = useState('global')

  const maxRepeats =
    shortTandemRepeatVariant.repeats[shortTandemRepeatVariant.repeats.length - 1][0]

  const repeatsInSelectedPopulation =
    selectedPopulation === 'global'
      ? shortTandemRepeatVariant.repeats
      : shortTandemRepeatVariant.populations.find(pop => pop.id === selectedPopulation).repeats

  return (
    <div style={{ width: '100%' }}>
      <ShortTandemRepeatRepeatCountsPlot
        maxRepeats={maxRepeats}
        repeats={repeatsInSelectedPopulation}
        thresholds={thresholds}
      />
      <div>
        <label
          htmlFor={`short-tandem-repeat-${shortTandemRepeatVariant.id}-repeat-counts-population`}
        >
          Population:{' '}
          <Select
            id={`short-tandem-repeat-${shortTandemRepeatVariant.id}-repeat-counts-population`}
            value={selectedPopulation}
            onChange={e => {
              setSelectedPopulation(e.target.value)
            }}
          >
            <option value="global">Global</option>
            {shortTandemRepeatVariant.populations.map(pop => (
              <option key={pop.id} value={pop.id}>
                {populationName(pop.id)}
              </option>
            ))}
          </Select>
        </label>
      </div>
    </div>
  )
}

ShortTandemRepeatRepeatCounts.propTypes = {
  shortTandemRepeatVariant: ShortTandemRepeatVariantPropType.isRequired,
  thresholds: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ),
}

ShortTandemRepeatRepeatCounts.defaultProps = {
  thresholds: [],
}

export default ShortTandemRepeatRepeatCounts