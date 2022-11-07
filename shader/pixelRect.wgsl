////////////////////////////////////////////////////////////////////////////////
// UNIFORMS

struct Parameters {
    surface: vec2<f32>,
    position: vec2<f32>,
    size: vec2<f32>,
}

@group(0) @binding(0) var<uniform> params: Parameters;
@group(0) @binding(1) var imageTexture: texture_2d<f32>;

////////////////////////////////////////////////////////////////////////////////
// VERTEX SHADER

const positions = array<vec2<f32>, 4>(
    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
    vec2(0.0, 1.0),
    vec2(1.0, 1.0),
);

const uvs = array<vec2<f32>, 4>(
    vec2(0.0, 1.0),
    vec2(1.0, 1.0),
    vec2(0.0, 0.0),
    vec2(1.0, 0.0),
);

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texCoord: vec2<f32>,
}

@vertex
fn vs_main(
    @builtin(vertex_index) index: u32
) -> VertexOutput
{
    let offset = vec2<f32>(
        params.position.x,
        params.surface.y - params.size.y - params.position.y
    );
    
    let pos = (positions[index] * params.size + offset) * 2.0 / params.surface - 1.0;

    var output: VertexOutput;
    output.position = vec4<f32>(pos, 0.0, 1.0);
    output.texCoord = uvs[index] * vec2<f32>(textureDimensions(imageTexture));
    return output;
}

////////////////////////////////////////////////////////////////////////////////
// FRAGMENT SHADER

@fragment
fn fs_main(
    @location(0) texCoord: vec2<f32>,
) -> @location(0) vec4<f32>
{
    let texel = textureLoad(imageTexture, vec2<u32>(texCoord), 0);
    return vec4<f32>(texel.rgb, 1.0);
}