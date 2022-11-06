/**
 * FF Typescript Foundation Library - WebGPU Tools
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import blurCode from "../shader/incremental_blur.wgsl";

/**
 * Computes a gaussian blur using compute shaders.
 */
export class GaussianBlur
{
    readonly device: GPUDevice;

    private _pipeline: GPUComputePipeline;
    private _paramsArray: Float32Array;
    private _paramsBuffer: GPUBuffer[];
    private _sampler: GPUSampler;
    private _bindGroupLayout: GPUBindGroupLayout;

    constructor(device: GPUDevice)
    {
        this.device = device;

        const blurModule = device.createShaderModule({
            code: blurCode,
        });

        this._paramsArray = new Float32Array(5);
        const bufferDesc = {
            size: this._paramsArray.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        };
        this._paramsBuffer = [
            device.createBuffer(bufferDesc),
            device.createBuffer(bufferDesc)
        ];

        this._sampler = device.createSampler({
            minFilter: "linear",
            magFilter: "linear",
            addressModeU: "repeat",
            addressModeV: "repeat",
        });

        this._bindGroupLayout = device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: "uniform", minBindingSize: this._paramsArray.byteLength },
            }, {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                sampler: { type: "filtering" },
            }, {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                texture: {},
            }, {
                binding: 3,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: { format: "rgba8unorm" },
            }],
        });

        const pipeLayout = device.createPipelineLayout({
            bindGroupLayouts: [ this._bindGroupLayout ],
        });

        this._pipeline = device.createComputePipeline({
            layout: pipeLayout,
            compute: {
                module: blurModule,
                entryPoint: "blur",
            },
        });
    }

    apply(source: GPUTexture, target: GPUTexture | null, sigmaHorz: number, sigmaVert: number): GPUTexture
    {
        const device = this.device;
        const { width, height } = source;

        const textureDesc: GPUTextureDescriptor = {
            size: [ source.width, source.height, 1 ],
            format: source.format,
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING
        };

        if (!target) {
            target = device.createTexture(textureDesc);
        }

        if (source.width !== target.width || source.height !== target.height) {
            throw RangeError("source and target texture sizes must match");
        }
        if ((source.usage & GPUTextureUsage.TEXTURE_BINDING) == 0) {
            throw RangeError("source texture usage must include GPUTextureUsage.TEXTURE_BINDING");
        }
        if ((target.usage & GPUTextureUsage.STORAGE_BINDING) == 0) {
            throw RangeError("target texture usage must include GPUTextureUsage.STORAGE_BINDING");
        }

        const temp = device.createTexture(textureDesc);
        const tempView = temp.createView();

        this._writeParams(sigmaHorz, false);
        this._writeParams(sigmaVert, true);

        const encoder = device.createCommandEncoder();
        const horzPass = encoder.beginComputePass();
        horzPass.setPipeline(this._pipeline);
        horzPass.setBindGroup(0, device.createBindGroup({
            layout: this._bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this._paramsBuffer[0] } },
                { binding: 1, resource: this._sampler },
                { binding: 2, resource: source.createView() },
                { binding: 3, resource: tempView },
            ],
        }));
        horzPass.dispatchWorkgroups(width, height)
        horzPass.end();

        const vertPass = encoder.beginComputePass();
        vertPass.setPipeline(this._pipeline);
        vertPass.setBindGroup(0, device.createBindGroup({
            layout: this._bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this._paramsBuffer[1] } },
                { binding: 1, resource: this._sampler },
                { binding: 2, resource: tempView },
                { binding: 3, resource: target.createView() },
            ],
        }));
        vertPass.dispatchWorkgroups(width, height)
        vertPass.end();
        device.queue.submit([ encoder.finish() ]); 

        temp.destroy();
        return target;
    }

    private _writeParams(sigma: number, isVertical: boolean)
    {
        const extent = Math.ceil(sigma * 4);
        const delta = 1;

        this._paramsArray.set([
            isVertical ? 0 : delta,
            isVertical ? delta : 0,
            extent,
            1.0 / (Math.sqrt(2.0 * Math.PI) * sigma),
            Math.exp(-0.5 / (sigma * sigma)),
        ]);

        this.device.queue.writeBuffer(this._paramsBuffer[isVertical ? 1 : 0], 0, this._paramsArray)
    }
}