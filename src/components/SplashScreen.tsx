import { useEffect, useRef } from "react";
import { Shield } from "lucide-react";
import { useTranslation } from "../utils/i18n";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useTranslation();
  const onCompleteRef = useRef(onComplete);

  // Keep ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let animationFrameId: number | null = null;
    let resizeListener: (() => void) | null = null;

    // Guaranteed timeout so splash completes cleanly in 2.2 seconds
    const timeout = setTimeout(() => {
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 2200);

    try {
      const canvas = canvasRef.current;
      if (canvas) {
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (gl) {
          const compileShader = (src: string, type: number) => {
            const s = gl.createShader(type);
            if (!s) return null;
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
              return null;
            }
            return s;
          };

          const vs = `
            attribute vec2 position;
            varying vec2 uv;
            void main() {
              uv = position * 0.5 + 0.5;
              gl_Position = vec4(position, 0.0, 1.0);
            }
          `;

          const fs = `
            precision highp float;
            uniform float u_time;
            varying vec2 uv;
            void main() {
              vec2 st = uv;
              vec3 color1 = vec3(0.898, 0.224, 0.208);
              vec3 color2 = vec3(0.06, 0.07, 0.1);
              
              float pulse = (sin(u_time * 2.2) * 0.5 + 0.5) * 0.35;
              float dist = distance(st, vec2(0.5));
              float alpha = smoothstep(0.48 + pulse, 0.08, dist);
              
              vec3 finalColor = mix(color2, color1, alpha * 0.15);
              gl_FragColor = vec4(finalColor, 1.0);
            }
          `;

          const vShader = compileShader(vs, gl.VERTEX_SHADER);
          const fShader = compileShader(fs, gl.FRAGMENT_SHADER);
          if (vShader && fShader) {
            const program = gl.createProgram();
            if (program) {
              gl.attachShader(program, vShader);
              gl.attachShader(program, fShader);
              gl.linkProgram(program);
              gl.useProgram(program);

              const vertices = new Float32Array([
                -1, -1,  1, -1, -1,  1,
                -1,  1,  1, -1,  1,  1,
              ]);

              const buffer = gl.createBuffer();
              gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
              gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

              const positionLoc = gl.getAttribLocation(program, "position");
              gl.enableVertexAttribArray(positionLoc);
              gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

              const uTimeLoc = gl.getUniformLocation(program, "u_time");
              let startTime = Date.now();

              const resize = () => {
                if (canvas) {
                  canvas.width = canvas.clientWidth || 1280;
                  canvas.height = canvas.clientHeight || 720;
                  gl.viewport(0, 0, canvas.width, canvas.height);
                }
              };
              resize();
              window.addEventListener("resize", resize);
              resizeListener = resize;

              const render = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                if (uTimeLoc) gl.uniform1f(uTimeLoc, elapsed);
                gl.clearColor(0.06, 0.07, 0.1, 1);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                animationFrameId = requestAnimationFrame(render);
              };
              render();
            }
          }
        }
      }
    } catch (e) {
      console.warn("WebGL background initialization skipped on splash:", e);
    }

    return () => {
      clearTimeout(timeout);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      if (resizeListener) {
        window.removeEventListener("resize", resizeListener);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-50 flex flex-col items-center justify-between z-50 overflow-hidden select-none">
      {/* GL Shader Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover opacity-60 z-0" />

      {/* Spacing top */}
      <div className="h-10" />

      {/* Centered branding section */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-[400px] text-center px-6 animate-fade-in">
        {/* SAHARA Logo Badge */}
        <div className="mb-6 w-32 h-32 flex items-center justify-center rounded-3xl bg-white shadow-xl border border-black/5 animate-pulse-soft">
          <img
            alt="SAHARA Logo"
            className="w-20 h-auto object-contain"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfcqMCRXzmDjpHCK0P6V1CA2R346cBQ4kptZApDeb5N8hXzqR15nGfCdtnmerZi06e_GzjCRAgF-yBvFKvZKFRkifdXDRwQYgoWwmnO6e0r2pIbYCmTxvzcSXCZe6Xh0ghN8ekPrqkMbdlyUUstx3ehjOUsvCHnfKLiH0FL_G-DanKqKz7YPUpRr2pjps165wlWbYsE1dZIxvF4vyLPy6dCH3wcUE8DQGJbrV-cI_m0Ihs8yzhBwhtBg"
          />
        </div>

        <h1 className="font-sans text-4xl font-extrabold tracking-tighter text-black mb-2">{t("common.appName")}</h1>
        <p className="font-sans text-sm text-neutral-500 tracking-wide font-medium leading-relaxed max-w-[280px]">
          {t("splash.tagline")}
        </p>
        <p className="font-sans text-xs text-red-600 font-bold uppercase tracking-wider mt-2 bg-red-50 border border-red-200/60 px-3 py-1 rounded-full">
          "No one should be helpless in an emergency."
        </p>

        {/* Loading Indicator */}
        <div className="mt-12 w-36 h-[2px] bg-neutral-200 overflow-hidden rounded-full">
          <div className="h-full bg-black w-full -translate-x-full animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
        </div>
      </div>

      {/* Bottom active status bar */}
      <div className="relative z-10 mb-12 flex flex-col items-center animate-fade-in" style={{ animationDelay: "1s" }}>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/95 border border-black/5 rounded-full shadow-md backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-neutral-600">
            {t("splash.watchdog")}
          </span>
        </div>
      </div>
    </div>
  );
}
