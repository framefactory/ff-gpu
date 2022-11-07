/**
 * FF Typescript Foundation Library - WebGPU Tools
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

export class UniformBuffer
{
    readonly device: GPUDevice;
    readonly hostBuffer: ArrayBuffer;
    readonly deviceBuffer: GPUBuffer;
    readonly byteSize: number;

    private _floatArray: Float32Array;
    private _intArray: Int32Array;

    constructor(device: GPUDevice, elementCount: number)
    {
        this.device = device;

        const elementSize = Float32Array.BYTES_PER_ELEMENT;
        const byteSize = this.byteSize = elementCount * elementSize;

        this.hostBuffer = new ArrayBuffer(byteSize);
        this.deviceBuffer = device.createBuffer({
            size: byteSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this._floatArray = new Float32Array(this.hostBuffer);
        this._intArray = new Int32Array(this.hostBuffer);
    }

    update()
    {
        this.device.queue.writeBuffer(this.deviceBuffer, 0, this.hostBuffer, 0);
    }

    destroy()
    {
        this.deviceBuffer.destroy();
    }

    setFloat(index: number, value: number)
    {
        this._floatArray[index] = value;
    }

    setFloatArray(index: number, array: ArrayLike<number>)
    {
        this._floatArray.set(array, index);
    }

    setInt(index: number, value: number)
    {
        this._intArray[index] = value;
    }

    setIntArray(index: number, array: ArrayLike<number>)
    {
        this._intArray.set(array, index);
    }
}