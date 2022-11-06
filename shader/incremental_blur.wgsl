/**
 * FF Typescript Foundation Library - WebGPU Tools
 * Copyright 2022 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

// Incremental Gaussian Blur
// https://developer.nvidia.com/gpugems/gpugems3/part-vi-gpu-computing/chapter-40-incremental-computation-gaussian
//
// only the center weight of the gaussian kernel is calculated explicitly.
// all other weights are calculated on the fly using second-order forward
// differences.

type vec2i = vec2<i32>;
type vec3u = vec3<u32>;
type vec2f = vec2<f32>;
type vec3f = vec3<f32>;
type vec4f = vec4<f32>;

struct Parameters {
    step: vec2f,
    extent: f32,
    g0: f32,
    g1: f32
}

@group(0) @binding(0) var<uniform> params: Parameters;
@group(0) @binding(1) var linearFilter: sampler;
@group(0) @binding(2) var inTexture: texture_2d<f32>;
@group(0) @binding(3) var outTexture: texture_storage_2d<rgba8unorm, write>;


// double-step incremental blur
// samples two texels at once using linear filtering
@compute @workgroup_size(1)
fn blur(
    @builtin(global_invocation_id) global_id: vec3u,
)
{
    let size = vec2f(textureDimensions(inTexture));
    let step = vec2f(params.step) / size;
    let coords = (vec2f(global_id.xy) + vec2f(0.5)) / size;
    let N = params.extent;

    var p = vec3f(params.g0, params.g1, params.g1 * params.g1);
    var sum = p.x * textureLoad(inTexture, global_id.xy, 0);

    for(var i: f32 = 1.0; i < N; i += 2.0) {
        let p1 = vec3f(p.xy * p.yz, p.z);
        p = vec3f(p1.xy * p1.yz, p1.z);
        let pp = p.x + p1.x;
        let f = p.x / pp;
        let offset = step * (i + f);
        sum += pp * textureSampleLevel(inTexture, linearFilter, coords + offset, 0);
        sum += pp * textureSampleLevel(inTexture, linearFilter, coords - offset, 0);
    }

    textureStore(outTexture, global_id.xy, sum);
}

// single-step incremental blur
// loads each texel individually
@compute @workgroup_size(1)
fn _blur(
    @builtin(global_invocation_id) global_id: vec3u,
)
{
    let coords = vec2i(global_id.xy);
    let step = vec2i(params.step);
    let N = i32(params.extent);

    var p = vec3f(params.g0, params.g1, params.g1 * params.g1);
    var sum = p.x * textureLoad(inTexture, coords, 0);

    for(var i: i32 = 1; i < N; i++) {
        p = vec3f(p.xy * p.yz, p.z);
        let offset = step * i;
        sum += p.x * textureLoad(inTexture, coords + offset, 0);
        sum += p.x * textureLoad(inTexture, coords - offset, 0);
    }

    textureStore(outTexture, coords, sum);
}