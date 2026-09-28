"""Svarog-inspired 3U CubeSat with a stowed sail, not a flight-hardware replica."""
import bpy
from pathlib import Path
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version = 0

def mat(name, rgb, metal=0, rough=0.45):
    m=bpy.data.materials.new(name);m.use_nodes=True
    s=m.node_tree.nodes.get('Principled BSDF')
    s.inputs['Base Color'].default_value=(*rgb,1)
    s.inputs['Metallic'].default_value=metal
    s.inputs['Roughness'].default_value=rough
    return m
silver=mat('Aluminium frame',(0.65,0.69,0.75),0.65)
blue=mat('Blue photovoltaic cells',(0.018,0.04,0.13),0.3,0.32)
gold=mat('Folded gold sail membrane',(0.65,0.34,0.07),0.65,0.36)
black=mat('Avionics enclosure',(0.025,0.03,0.04),0.15)
strap=mat('Sail restraint bands',(0.12,0.13,0.15),0.25)

def box(name, loc, dims, material, bevel=0.012):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.name=name;o.dimensions=dims
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material)
    if bevel:
        b=o.modifiers.new('Machined edges','BEVEL');b.width=bevel;b.segments=2
        bpy.ops.object.modifier_apply(modifier=b.name)
        o.modifiers.new('Corner normals','WEIGHTED_NORMAL')
    return o

def beam(name, a, b, width, material):
    a,b=Vector(a),Vector(b)
    o=box(name,(a+b)/2,(width,width,(b-a).length),material,0.003)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler()

# Three stacked 1U bays; sail package occupies the middle bay.
for x in [-0.46,0.46]:
    for y in [-0.46,0.46]:
        box('Continuous 3U rail',(x,y,0),(0.085,0.085,3),silver)
for z in [-1.46,-0.5,0.5,1.46]:
    for y in [-0.46,0.46]:box('Bay cross member',(0,y,z),(0.92,0.075,0.075),silver)
    for x in [-0.46,0.46]:box('Bay cross member',(x,0,z),(0.075,0.92,0.075),silver)
for z in [-0.99,0.99]:
    box('Avionics module',(0,0,z),(0.83,0.83,0.85),black)
    # Fixed cells supplement the deployed end-mounted array.
    for row in range(3):
        zz=z+(row-1)*0.24
        for column in [-1,1]:
            for y in [-0.432,0.432]:
                box('Body solar cell',(column*0.19,y,zz),(0.34,0.018,0.21),blue,0.008)
            for x in [-0.432,0.432]:
                box('Body solar cell',(x,column*0.19,zz),(0.018,0.34,0.21),blue,0.008)
# Compact pleats make the packaged membrane legible through the central frame.
for i in range(16):
    z=-0.36+i*0.048
    o=box('Stowed sail pleat',(0,0,z),(0.79 if i%2 else 0.74,0.77,0.045),gold,0.01)
    o.rotation_euler.z=0.025 if i%2 else -0.025
for x in [-0.22,0.22]:
    box('Sail retention strap',(x,-0.405,0),(0.055,0.025,0.81),strap)
    box('Sail retention strap',(x,0.405,0),(0.055,0.025,0.81),strap)
face_glow=mat('Luminous forward end face',(0.32,0.58,0.85),0,0.5)
face_shader=face_glow.node_tree.nodes.get('Principled BSDF')
face_shader.inputs['Emission Color'].default_value=(0.32,0.58,0.85,1)
face_shader.inputs['Emission Strength'].default_value=0.65
for z in [-1.5,1.5]:
    box('End plate',(0,0,z),(0.91,0.91,0.04),silver)
    panel=box('Luminous forward face' if z>0 else 'End access panel',
        (0,0,z+(-0.023 if z<0 else 0.023)),(0.75,0.75,0.012),face_glow if z>0 else black)
    if z>0:panel['emissiveSurface']=True
    for x in [-0.35,0.35]:
        for y in [-0.35,0.35]:box('Fastener',(x,y,z+(-0.025 if z<0 else 0.025)),(0.045,0.045,0.015),strap)
# Four hinged wings around the forward end, matching the reference's cross.
substrate=mat('Copper solar panel substrate',(0.38,0.18,0.045),0.35)
for axis in [0,1]:
    for sign in [-1,1]:
        loc=[0,0,1.54];loc[axis]=sign*1.12
        dims=[0.86,0.86,0.045];dims[axis]=1.22
        box('Deployed solar panel',loc,dims,substrate,0.012)
        hinge=[0,0,1.5];hinge[axis]=sign*0.49
        hdims=[0.18,0.18,0.10];hdims[1-axis]=0.45
        box('Panel hinge',hinge,hdims,silver)
        for row in range(3):
            for column in [-1,1]:
                cell=list(loc)
                cell[axis]+= (row-1)*0.38
                cell[1-axis]=column*0.2
                cdims=[0.35,0.35,0.012];cdims[1-axis]=0.36
                for face in [-1,1]:
                    cell[2]=1.54+face*0.031
                    box('Deployed photovoltaic cell',cell,cdims,blue,0.009)

# Eight luminous blue corner beacons. The frame itself remains non-emissive.
beacon=mat('Blue navigation beacon',(0.01,0.28,1),0,0.25)
shader=beacon.node_tree.nodes.get('Principled BSDF')
shader.inputs['Emission Color'].default_value=(0.01,0.28,1,1)
shader.inputs['Emission Strength'].default_value=1
for x in [-0.5,0.5]:
    for y in [-0.5,0.5]:
        for z in [-1.48,1.48]:
            bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=0.085,location=(x,y,z))
            obj=bpy.context.object
            obj.name='Blue corner beacon'
            obj.data.materials.append(beacon)
            obj['emissiveSurface']=True
            for face in obj.data.polygons:face.use_smooth=True
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'tools/modeling/svarog-cubesat.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'assets/models/svarog-cubesat.glb'),export_format='GLB',export_apply=True,export_extras=True)
