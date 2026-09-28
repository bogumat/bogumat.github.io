"""Build the closed Blog book. Run with Blender --background --python this_file."""
import bpy
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, emission=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = 0.6
    shader.inputs['Emission Color'].default_value = (*color, 1)
    shader.inputs['Emission Strength'].default_value = emission
    return mat

white = material('White cloth covers', (0.9, 0.91, 0.94))
paper = material('Warm paper', (0.73, 0.7, 0.64))
line = material('Page edges', (0.4, 0.38, 0.35))

def box(name, location, dimensions, mat, bevel=0.015):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Soft bound edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
        obj.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
    return obj

# Blender Z is up; the front cover faces -Y (glTF +Z).
box('Closed page block', (0.025, 0, 0), (1.02, 0.25, 1.43), paper)
box('Front cover', (0, -0.16, 0), (1.12, 0.065, 1.56), white)
box('Back cover', (0, 0.16, 0), (1.12, 0.065, 1.56), white)
box('Rounded spine', (-0.53, 0, 0), (0.095, 0.34, 1.56), white, 0.035)
for i in range(1, 13):
    y = -0.125 + i * 0.25 / 13
    box(f'Page edge {i}', (0.536, y, 0), (0.002, 0.0025, 1.41), line, 0)

# Official transparent Substack artwork, kept in its original orange.
logo = bpy.data.materials.new('Luminous Substack orange')
logo.use_nodes = True
nodes = logo.node_tree.nodes
shader = nodes.get('Principled BSDF')
tex = nodes.new('ShaderNodeTexImage')
tex.image = bpy.data.images.load(str(ROOT / 'tools/modeling/substack-logo.png'))
tex.image.pack()
logo.node_tree.links.new(tex.outputs['Color'], shader.inputs['Base Color'])
logo.node_tree.links.new(tex.outputs['Color'], shader.inputs['Emission Color'])
logo.node_tree.links.new(tex.outputs['Alpha'], shader.inputs['Alpha'])
shader.inputs['Emission Strength'].default_value = 1
shader.inputs['Roughness'].default_value = 1
if hasattr(logo, 'surface_render_method'):
    logo.surface_render_method = 'DITHERED'
else:
    logo.blend_method = 'BLEND'
bpy.ops.mesh.primitive_plane_add(size=1, location=(0.035, -0.195, 0.05), rotation=(math.pi / 2, 0, 0))
mark = bpy.context.object
mark.name = 'Substack luminous cover mark'
mark.scale = (0.98, 0.98, 0.98)
mark.data.materials.append(logo)

bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'tools/modeling/substack-book.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'assets/models/substack-book.glb'), export_format='GLB', export_apply=True)
