<article>
    <h1 class="detail__title">Dissertation</h1>

    <section>
        <h2>My Virtual Horse: An AR Experience</h2>
        <p class="detail-cv-meta"><em>MSci Dissertation Project &bull; Cardiff University</em></p>

        <h3>The Brief</h3>
        <p>A Welsh horse club wanted to explore whether XR technology could help people
        experience their horses remotely. The long-term vision was a full interactive
        experience; the realistic first step was a proof of concept &mdash; an AR environment
        where a user wearing a Meta Quest headset could see a realistic horse model in
        their physical space.</p>
    </section>

    <hr class="gold-rule">

    <section>
        <h3>What I Built</h3>
        <p><strong>A realistic 3D horse model</strong> of a specific Welsh Pony and Cob,
        modelled in Blender using quad-based topology. I visited the client&rsquo;s stables
        to photograph the actual horse from multiple angles, then used those reference photos
        to trace, build, and texture the model. The topology was designed with animation in
        mind &mdash; denser mesh around the face and ears where horses are most expressive,
        cleaner flow along the joints for natural deformation.</p>

        <p><strong>A textured, rigged, animated model.</strong> UV unwrapped, texture-painted
        using the reference photos as stencil overlays, rigged using Rigify (after comparing
        it against a hand-built skeleton), and animated with a looping idle animation &mdash;
        ear twitches, head movement, the small things that make a static model feel alive.</p>

        <p><strong>An AR environment in Unity</strong> configured for Meta Quest passthrough.
        This meant stripping out Unity&rsquo;s default post-processing (volumetric lighting,
        HDR), setting up XR-specific camera tracking, plane detection, and anchor management,
        and solving the various import conflicts between Blender&rsquo;s export format and
        Unity&rsquo;s expectations.</p>
    </section>

    <hr class="gold-rule">

    <section>
        <h3>What Didn&rsquo;t Work</h3>
        <p><strong>Hair.</strong> Blender&rsquo;s hair particle system doesn&rsquo;t export
        cleanly to Unity. The strand-based approach that works for pre-rendered 3D simply
        isn&rsquo;t practical for real-time AR on mobile hardware.</p>

        <p><strong>Fur.</strong> Shell-method fur shaders designed for Unity&rsquo;s Universal
        Render Pipeline partially worked &mdash; but only rendered for one eye. AR requires
        stereo rendering, and the shader wasn&rsquo;t written to handle that. The horse
        appeared fully furred in the left eye and invisible in the right. This is a genuine
        unsolved edge case in AR development &mdash; most fur shaders assume mono rendering.</p>

        <p><strong>Device deployment.</strong> The project runs correctly in Unity&rsquo;s
        Play Mode on the Meta Quest via developer mode. However, building directly to the
        headset as a standalone app failed &mdash; Unity wouldn&rsquo;t recognise the Quest
        as a build target. The AR experience works, but only tethered to a development
        environment.</p>
    </section>

    <hr class="gold-rule">

    <section>
        <h3>What I Learned</h3>
        <p><strong>Modelling organic forms is a different discipline than modelling objects.</strong>
        A cube is simple shapes. A horse is continuous curves, flowing topology, and every edge
        decision affects how the model deforms when animated. I iterated the model multiple times,
        and each version taught me something the previous one couldn&rsquo;t.</p>

        <p><strong>Preparation matters more than skill.</strong> The reference photos from the
        stable visit were the single most valuable asset in the project. Without them, I&rsquo;d
        have been guessing at proportions and textures. With them, I could paint directly from
        reality.</p>

        <p><strong>Knowing what doesn&rsquo;t work is as valuable as knowing what does.</strong>
        The hair and fur failures aren&rsquo;t just failures &mdash; they&rsquo;re documentation
        of where the current toolchain breaks down for AR. That&rsquo;s useful information for
        anyone attempting similar work.</p>

        <p><strong>Client work requires managing expectations.</strong> I&rsquo;m naturally
        ambitious, and I had to learn to say &ldquo;that&rsquo;s outside the scope&rdquo; without
        it feeling like giving up. The client wanted a full interactive experience. What I could
        deliver was a strong foundation and an honest assessment of what&rsquo;s possible now
        versus what needs more development.</p>
    </section>

    <hr class="gold-rule">

    <section>
        <h3>Technologies</h3>
        <p>Blender (modelling, texturing, rigging, animation), Unity (AR environment, XR integration),
        C# (Unity scripting), Meta Quest (hardware target), Meta XR SDK (passthrough, tracking)</p>
    </section>
</article>
