/**
 * FF Typescript Foundation Library
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { EElementType } from "@ffweb/geo/BufferLayout.js";
import { Geometry, ETopology } from "@ffweb/geo/Geometry.js"


const _webgpuTypeName: Record<EElementType, string> = {
    [EElementType.Int8]: "sint8",
    [EElementType.UInt8]: "uint8",
    [EElementType.Norm8]: "snorm8",
    [EElementType.UNorm8]: "unorm8",
    [EElementType.Int16]: "sint16",
    [EElementType.UInt16]: "uint16",
    [EElementType.Norm16]: "snorm16",
    [EElementType.UNorm16]: "unorm16",
    [EElementType.Int32]: "sint32",
    [EElementType.UInt32]: "uint32",
    [EElementType.Float16]: "float16",
    [EElementType.Float32]: "float32",
};

const _webgpuTopologyName: Record<ETopology, GPUPrimitiveTopology> = {
    [ETopology.PointList]: "point-list",
    [ETopology.LineList]: "line-list",
    [ETopology.LineStrip]: "line-strip",
    [ETopology.TriangleList]: "triangle-list",
    [ETopology.TriangleStrip]: "triangle-strip",
}


export class GPUGeometry
{
    vertexBuffer: GPUBuffer = null;
    vertexBufferUsage = GPUBufferUsage.VERTEX;

    indexBuffer: GPUBuffer = null;
    indexBufferUsage = GPUBufferUsage.INDEX;

    readonly geometry: Geometry;
    readonly device: GPUDevice;

    constructor(device: GPUDevice, geometry: Geometry)
    {
        this.geometry = geometry;
        this.device = device;
    }

    get topology(): GPUPrimitiveTopology {
        return _webgpuTopologyName[this.geometry.topology];
    }

    get indexFormat(): GPUIndexFormat {
        return _webgpuTypeName[this.geometry.indexElementType] as GPUIndexFormat;
    }
    
    setBuffers(encoder: GPURenderPassEncoder, slot = 0)
    {
        encoder.setVertexBuffer(slot, this.vertexBuffer);
        encoder.setIndexBuffer(this.indexBuffer, this.indexFormat);
    }

    draw(encoder: GPURenderPassEncoder, partIndex = -1)
    {
        const parts = this.geometry.parts;

        if (partIndex >= 0) {
            const part = parts[partIndex]
            encoder.drawIndexed(part.count, 1, part.offset, 0, 0);
        }
        else {
            encoder.drawIndexed(this.geometry.indexCount, 1, 0, 0, 0);
        }
    }

    update()
    {
        const geo = this.geometry;
        geo.update();

        if (this.vertexBuffer) {
            this.vertexBuffer.destroy();
        }

        this.vertexBuffer = this.device.createBuffer({
            size: geo.vertexBufferSize,
            usage: this.vertexBufferUsage,
            mappedAtCreation: true
        });

        if (this.indexBuffer) {
            this.indexBuffer.destroy();
        }

        this.indexBuffer = this.device.createBuffer({
            size: geo.indexBufferSize,
            usage: this.indexBufferUsage,
            mappedAtCreation: true
        });

        // const va = new ArrayBuffer(geo.vertexBufferSize);
        // const ia = new ArrayBuffer(geo.indexBufferSize);
        // geo.generate(va, ia);
        // console.log(new Float32Array(va));
        // console.log(new Uint32Array(ia));

        const vertexArray = this.vertexBuffer.getMappedRange();
        const indexArray = this.indexBuffer.getMappedRange();
        geo.generate(vertexArray, indexArray);
        this.vertexBuffer.unmap();
        this.indexBuffer.unmap();
    }

    /**
     * Returns a WebGPU compatible vertex buffer layout object.
     * This only works for layouts with interleaved attributes.
     * @param stepMode The array step mode, default is "vertex".
     * @returns The vertex buffer layout.
     */
    createVertexBufferLayout(stepMode: GPUVertexStepMode = "vertex"): GPUVertexBufferLayout
    {
        const attrs = this.geometry.layout.attributes;
        const arrayStride = attrs.length > 0 ? attrs[0].stride : 0;

        const attributes = attrs.map((attrib, index) => {
            let format: GPUVertexFormat;

            if (attrib.elementCount > 1
                    || (attrib.type !== EElementType.Float16 && attrib.type !== EElementType.Float32)) {
                format = `${_webgpuTypeName[attrib.type]}x${attrib.elementCount}` as GPUVertexFormat;
            }
            else {
                format = _webgpuTypeName[attrib.type] as GPUVertexFormat;
            }
            return {
                shaderLocation: index,
                format,
                offset: attrib.offset
            };
        });

        return {
            arrayStride,
            stepMode,
            attributes
        };
    }
}