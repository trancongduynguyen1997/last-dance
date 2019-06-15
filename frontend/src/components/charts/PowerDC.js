import React, { Component } from 'react'
import io from "socket.io-client";

import DoughnutChart from './DoughnutChart';

export default class PowerDC extends Component {
    state = {
        data: [
            {
                name: "Power",
                power: 0
            },
            {
                name: "Ref",
                refKey: this.props.maxScale
            }
        ],
        flash: false
    }
    newData = JSON.parse(JSON.stringify(this.state.data)); //deep clone
    componentWillReceiveProps(nxtProps) {
        if(nxtProps.maxScale !== this.props.maxScale) {
            this.newData[1].refKey = nxtProps.maxScale;
            this.setState({
                data: this.newData
            })
        }
    }
    render() {
        const { data } = this.state;
        return (
            <div className="power-dc">
                <DoughnutChart data={data.concat([])}
                    data1={data.concat([])}
                    dataKey="power"
                    fault={this.props.faultLvl}                             /**/
                    warn={this.props.warnLvl}
                    colorId="power"
                    startGradColor="#84fab0"
                    endGradColor="#8fd3f4"
                    theUnit="kW"
                    flash={this.state.flash}
                    onAdjTriClick={this.props.onAdjTriClick}
                    id={this.props.id}
                    triBtnPos={this.props.triBtnPos}
                    maxScale={this.props.maxScale}
                    bSize={this.props.bSize}
                    sSize={this.props.sSize}>
                </DoughnutChart>
            </div>
        )
    }

    componentDidMount() {
        this.socket = io().connect();
        this.socket.on(this.props.ioTopic, function (motorObj) {
            this.newData[0].power = motorObj[this.props.valKey];
            this.setState((state) => {
                return {
                    data: this.newData
                }
            });
            if (motorObj[this.props.valKey] > 80) {
                this.setState({
                    flash: !this.state.flash
                })
            }
        }.bind(this));
    };

    componentWillUnmount() {
        this.socket.disconnect();
        this.socket.on("connect_error", function (error) {
            console.log(error);
            this.socket.disconnect();
        })
    };

}
