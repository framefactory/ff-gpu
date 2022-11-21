/**
 * FF Typescript Foundation Library - WebGPU Tools
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Dictionary } from "@ffweb/core/types.js";

////////////////////////////////////////////////////////////////////////////////

interface IUniformMember
{
    offset: number;
    size: number;
}

export class UniformBuffer
{
    readonly device: GPUDevice;

    private _arrayBuffer: ArrayBuffer = null;
    private _floatArray: Float32Array = null;
    private _intArray: Int32Array = null;
    private _elementCount = 0;
    private _byteSize = 0;
    private _declarations: string[] = [];
    private _members: Dictionary<IUniformMember> = {}; 

    constructor(device: GPUDevice)
    {
        this.device = device;
    }

    addFloat(key: string): this
    {
        this._declarations.push(`${key}: f32,`);
        this._members[key] = {
            offset: this._elementCount,
            size: 1,
        };
        this._elementCount += 1;

        return this;
    }

    addInt(key: string): this
    {
        this._declarations.push(`${key}: i32,`);
        this._members[key] = {
            offset: this._elementCount,
            size: 1,
        };
        this._elementCount += 1;

        return this;
    }

    addFloatArray(key: string, elementCount: number): this
    {
        this._declarations.push(`${key}: vec${elementCount}<f32>,`);
        this._members[key] = {
            offset: this._elementCount,
            size: elementCount,
        };
        this._elementCount += elementCount;

        return this;
    }

    addIntArray(key: string, elementCount: number): this
    {
        this._declarations.push(`${key}: vec${elementCount}<i32>,`);
        this._members[key] = {
            offset: this._elementCount,
            size: elementCount,
        };
        this._elementCount += elementCount;

        return this;
    }

    create(): this
    {
        this._byteSize = this._elementCount * Float32Array.BYTES_PER_ELEMENT;
        this._arrayBuffer = new ArrayBuffer(this._byteSize);
        this._floatArray = new Float32Array(this._arrayBuffer);
        this._intArray = new Int32Array(this._arrayBuffer);

        return this;
    }

    setFloat(key: string, value: number): this
    {
        const member = this._members[key];
        this._floatArray[member.offset] = value;

        return this;
    }

    setFloatArray(key: string, array: ArrayLike<number>): this
    {
        const member = this._members[key];
        this._floatArray.set(array, member.offset);

        return this;
    }

    setInt(key: string, value: number): this
    {
        const member = this._members[key];
        this._intArray[member.offset] = value;

        return this;
    }

    setIntArray(key: string, array: ArrayLike<number>): this
    {
        const member = this._members[key];
        this._intArray.set(array, member.offset);

        return this;
    }

    createDeviceBuffer(usage?: GPUBufferUsageFlags): GPUBuffer
    {
        return this.device.createBuffer({
            size: this._byteSize,
            usage: usage ?? GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });
    }

    createShaderStruct(typeName = "Uniforms"): string
    {
        return [
            `struct ${typeName} {`,
            ...this._declarations,
            "}\n\n",
        ].join("\n");
    }

    createBindGroupLayoutEntry(
        binding: number, visibility?: GPUShaderStageFlags): GPUBindGroupLayoutEntry
    {
        return {
            binding,
            buffer: { type: "uniform", minBindingSize: this._byteSize },
            visibility: visibility ?? GPUShaderStage.FRAGMENT
        };
    }

    writeBuffer(deviceBuffer: GPUBuffer)
    {
        this.device.queue.writeBuffer(deviceBuffer, 0, this._arrayBuffer, 0);
    }
}