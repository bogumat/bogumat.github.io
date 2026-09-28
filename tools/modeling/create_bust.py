"""Prepare Poly Haven's CC0 Marble Bust 01 by Rico Cilliers for the SoTA orbit.
Source: https://polyhaven.com/a/marble_bust_01
Original mesh and marble maps are preserved; we add two luminous eye overlays.
"""
import bpy
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.import_scene.gltf(filepath=str(ROOT/'tools/modeling/polyhaven/marble_bust_01/marble_bust_01.gltf'))
body=next(o for o in bpy.context.scene.objects if o.type=='MESH')
bpy.context.view_layer.objects.active=body
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
body.name='Poly Haven marble bust by Rico Cilliers'
for m in body.data.materials:
    shader=m.node_tree.nodes.get('Principled BSDF')
    if shader:shader.inputs['Emission Strength'].default_value=0
# Coordinates follow the original asymmetric portrait, including its head tilt.
eye=bpy.data.materials.new('Magenta luminous eyes');eye.use_nodes=True
shader=eye.node_tree.nodes.get('Principled BSDF')
shader.inputs['Base Color'].default_value=(1,0.008,0.32,1)
shader.inputs['Emission Color'].default_value=(1,0.008,0.32,1)
shader.inputs['Emission Strength'].default_value=1
for label,x,z in [('Left',-0.060,0.3905),('Right',0.010,0.3845)]:
    hit,point,normal,_=body.ray_cast(Vector((x,-1,z)),Vector((0,1,0)))
    if not hit:raise RuntimeError('Could not locate eye surface')
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,radius=1,location=(x,point.y-0.0007,z))
    obj=bpy.context.object;obj.name=label+' magenta eye'
    obj.scale=(0.012,0.0025,0.0045)
    obj.rotation_euler.y=0.08
    obj.data.materials.append(eye);obj['emissiveSurface']=True
    for polygon in obj.data.polygons:polygon.use_smooth=True
    print(label,'eye',tuple(obj.location))
for image in bpy.data.images:
    if image.source=='FILE':image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'tools/modeling/sota-bust.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets/models/sota-bust.glb'),export_format='GLB',export_apply=True,export_extras=True)
