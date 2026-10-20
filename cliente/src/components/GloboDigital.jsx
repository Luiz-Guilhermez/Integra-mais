import { useEffect, useRef } from "react"
import * as THREE from "three"

function GloboDigital() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(
            45,
            1,
            0.1,
            100
        )
        camera.position.z = 3

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        })
        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2)
        )

        const geometry = new THREE.SphereGeometry(
            1,
            50,
            50
        )
        const material = new THREE.PointsMaterial({
            color: 0x999999,
            size: 0.012,
            transparent: true,
            opacity: 0.45
        })
        const globo = new THREE.Points(
            geometry,
            material
        )
        scene.add(globo)

        function resize() {
            const width = canvas.clientWidth
            const height = canvas.clientHeight
            renderer.setSize(
                width,
                height,
                false
            )

            camera.aspect = width / height
            camera.updateProjectionMatrix()
        }
        resize()

        window.addEventListener(
            "resize",
            resize
        )

        function animar() {
            requestAnimationFrame(animar)

            globo.rotation.y += 0.001
            renderer.render(
                scene,
                camera
            )
        }
        animar()

        return () => {
            window.removeEventListener(
                "resize",
                resize
            )

            geometry.dispose()
            material.dispose()
            renderer.dispose()
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="h-full w-full"
        />
    )
}

export default GloboDigital