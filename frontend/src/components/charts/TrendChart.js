import React, { Component } from 'react'
import {
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area
} from 'recharts';

import "../CSS/AreaChartStyle.css";

export default class TrendChart extends Component {
  render() {
    const { data, dataKey, yAxisName, customColor, colorId, onStopClick } = this.props
    return (
      <div className="area-chart-wrapper" onClick={onStopClick}>
        <i className="fas fa-pause" ></i>
        <p className="yAxis-name" style={{color: customColor}}>{yAxisName}</p>
        <AreaChart width={this.props.width} height={this.props.height} 
          data={data}
          padding={{ top: 0, right: 0, left: 0, bottom: 0 }}
          margin={{ top: 0, right: 0 }}
          >

          <defs>
            <linearGradient id={colorId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={customColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={customColor} stopOpacity={0} />
            </linearGradient>
          </defs>
    
          <XAxis dataKey="time" tick={{ stroke: 'white', fontSize: "small!important" }} />
          <YAxis tick={{ stroke: 'white' }} />

          <Tooltip offset={0}
            wrapperStyle={{ backgroundColor: "#EFF6E0", boxShadow: "0 0 0.4em 0.1em #009999ff" }}
            labelStyle={{ color: "#301014" }}
            itemStyle={{ color: "#0D0A0B" }}
            formatter={function (value, name) {
              return `${Number(value).toFixed(2)}`;
            }}
            labelFormatter={function (value) {
              return `Time: ${value}`;
            }} />
          <Area type="monotone"
            dot={true}
            dataKey={dataKey}
            stroke={customColor}
            fillOpacity={1} fill={`url(#${colorId})`} />
        </AreaChart>
        <p className="xAxis-name" style={{color: customColor}} >Time </p>
      </div>
    )
  }
}
