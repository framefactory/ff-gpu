/**
 * FF Typescript Foundation Library - WebGPU Tools
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Surface } from "@ffweb/gpu/Surface.js";

import unitRectShader from "../shader/pixelRect.wgsl";
import { PipelineCache } from "./PipelineCache.js";

interface ITextureRectParams {
    position: [ number, number ];
    size: [ number, number ];
    scale: number;
}

export class PixelRect
{
    readonly device: GPUDevice;

    readonly params: ITextureRectParams = {
        position: [ 0, 0 ],
        size: [ 0, 0 ],
        scale: 1.0
    }

    private _uniformArray: Float32Array;
    private _uniformBuffer: GPUBuffer;
    private _bindGroup: GPUBindGroup;
    private _pipeline: GPURenderPipeline;

    constructor(cache: PipelineCache, texture: GPUTexture,
        params?: Partial<ITextureRectParams>)
    {
        const device = this.device = cache.device;

        this.params.size[0] = texture.width;
        this.params.size[1] = texture.height;
        this.params = { ...this.params, ...params };

        this._uniformArray = new Float32Array(6);
        this._uniformBuffer = device.createBuffer({
            size: this._uniformArray.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.update();
         
        const shaderModule = cache.createShaderModule({
            code: unitRectShader,
        });

        const bindGroupLayout = cache.createBindGroupLayout({
            entries: [{
                binding: 0,
                buffer: { type: "uniform" },
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            }, {
                binding: 1,
                texture: { sampleType: "unfilterable-float" },
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            }],
        });

        const pipelineLayout = cache.createPipelineLayout({
            bindGroupLayouts: [ bindGroupLayout ],
        });

        this._pipeline = cache.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: shaderModule,
                entryPoint: "vs_main",
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fs_main",
                targets: [{
                    format: Surface.getPreferredFormat(),
                }],
            },
            primitive: {
                topology: "triangle-strip"
            },
        });

        this._bindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this._uniformBuffer },
            }, {
                binding: 1,
                resource: texture.createView(),
            }],
        });
    }

    update()
    {
        const params = this.params;
        const uniforms = this._uniformArray;
        uniforms[2] = params.position[0];
        uniforms[3] = params.position[1];
        uniforms[4] = params.size[0] * params.scale;
        uniforms[5] = params.size[1] * params.scale;
        this.device.queue.writeBuffer(this._uniformBuffer, 0, uniforms);
    }

    setSurfaceSize(surface: Surface)
    {
        this._uniformArray[0] = surface.width;
        this._uniformArray[1] = surface.height;
        this.device.queue.writeBuffer(this._uniformBuffer, 0, this._uniformArray);
    }

    render(pass: GPURenderPassEncoder)
    {
        pass.setPipeline(this._pipeline);
        pass.setBindGroup(0, this._bindGroup);
        pass.draw(4);
    }
}