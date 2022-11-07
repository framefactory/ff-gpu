/**
 * FF Typescript Foundation Library - WebGPU Tools
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { math } from "@ffweb/core/math.js"
import { mat3, mat4 } from "gl-matrix";

export class GPUTransform
{
    readonly device: GPUDevice;
    readonly buffer: GPUBuffer;
    readonly bindGroupLayout: GPUBindGroupLayout;
    readonly bindGroup: GPUBindGroup;

    modelMatrix = mat4.create();
    viewMatrix = mat4.create();
    projectionMatrix = mat4.create();

    mvpMatrix = mat4.create();
    mvMatrix = mat4.create();
    normalMatrix = mat4.create();

    readonly bufferSize = (16 + 16 + 16) * 4;


    constructor(device: GPUDevice)
    {
        this.device = device;

        this.buffer = device.createBuffer({
            size: this.bufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.bindGroupLayout = device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: "uniform", minBindingSize: this.bufferSize  }
            }],
        });

        this.bindGroup = device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.buffer }
            }],
        });
    }

    update()
    {
        const mvpMat = this.mvpMatrix as Float32Array;
        const mvMat = this.mvMatrix as Float32Array;
        const normalMat = this.normalMatrix as Float32Array;

        mat4.transpose(normalMat, mvMat);
        mat4.invert(normalMat, normalMat);
        mat4.multiply(mvMat, this.viewMatrix, this.modelMatrix);
        mat4.multiply(mvpMat, this.projectionMatrix, mvMat);

        this.device.queue.writeBuffer(this.buffer, 0,
            mvpMat.buffer, mvpMat.byteOffset, mvpMat.byteLength);
        this.device.queue.writeBuffer(this.buffer, 64,
            mvMat.buffer, mvMat.byteOffset, mvMat.byteLength);
        this.device.queue.writeBuffer(this.buffer, 128,
            normalMat.buffer, normalMat.byteOffset, normalMat.byteLength);
    }
}