////////////////////////////////////////////////////////////////////////////////
// MIPMAP GENERATOR - COMPUTE SHADER

@group(0) @binding(0) var inLevel: texture_2d<f32>;
@group(0) @binding(1) var outLevel: texture_storage_2d<rgba8unorm,write>;

var<workgroup> p: array<vec4<f32>, 4>;

@compute @workgroup_size(2, 2)
fn main(
    @builtin(local_invocation_id) local_id: vec3<u32>,
    @builtin(global_invocation_id) global_id: vec3<u32>,
    @builtin(num_workgroups) size: vec3<u32>,
)
{
    let coords = global_id.xy;
    let local_index = 2 * local_id.y + local_id.x;
    p[local_index] = textureLoad(inLevel, coords, 0);

    if (local_index == 0) {
        let pixel = (p[0] + p[1] + p[2] + p[3]) * 0.25;
        textureStore(outLevel, coords / 2, pixel);
    }
}