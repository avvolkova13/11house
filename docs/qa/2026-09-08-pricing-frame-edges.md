# Pricing reflection frame correction

Reference: https://recent.design/i/ghhhqxm-obscura-visuals-gradient-pack

Compared the embedded video at 0.6 s (edge-on) and 1.5 s (foreground arrival) with the live renderer. The reference's reflection extends beyond the frame, with a narrow curved centreline when the card turns edge-on.

## Corrections

- Replace the white border around the canvas with padding: the canvas now covers the complete white section, including the breathing room. Remove its inset fade mask.
- Keep the tail visible up to the actual section boundary; remove the premature outer fade.
- Curve the reflection's centreline without rotating its outer face toward the viewer. This removes the triangular fan when the card is edge-on.
- Increase optical diffusion and channel separation; provide additional transparent geometry for the wider fringe.
- Match transparent canvas compositing to NormalBlending with premultipliedAlpha. The previous mismatch produced a grey silhouette even where the shader sampled white.

Checked the static frame, intermediate turn and 390 px renderer width. Card illustrations, content and interaction controls are retained. This is an adaptation using our card textures, not a copy of the reference artwork.
