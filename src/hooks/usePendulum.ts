import { useAnimationFrame, useMotionValue, useReducedMotion } from "framer-motion";
import { useCallback, useLayoutEffect, useRef } from "react";
import { clamp } from "../lib/util";

export interface PendulumOptions {
  stiffness?: number; // restoring force: higher = quicker swing
  damping?: number; // friction: lower = more oscillation
  max?: number; // clamp in degrees
  idle?: number; // ambient "studio air" drift amplitude
  phase?: number;
  rest?: number; // resting angle
  drive?: () => number; // external target angle, sampled every frame
}

/**
 * Damped pendulum integrated per frame (semi-implicit Euler).
 * angle → CSS rotate around the hook; velocity → cloth skew so the hem trails.
 */
export function usePendulum(options: PendulumOptions = {}) {
  const opts = useRef(options);
  useLayoutEffect(() => {
    opts.current = options;
  });
  const reduced = useReducedMotion() ?? false;
  const angle = useMotionValue(options.rest ?? 0);
  const velocity = useMotionValue(0);
  const sim = useRef({ theta: options.rest ?? 0, omega: 0, push: 0 });

  useAnimationFrame((time, delta) => {
    const { stiffness = 30, damping = 3, max = 14, idle = 0, phase = 0, rest = 0, drive } = opts.current;
    const dt = Math.min(delta, 40) / 1000;
    if (dt <= 0) return;
    const s = sim.current;
    const calm = reduced ? 0.25 : 1;
    const air = reduced ? 0 : idle * (Math.sin(time * 0.0011 + phase) + 0.4 * Math.sin(time * 0.0027 + phase * 2.3));
    const target = rest + ((drive?.() ?? 0) + s.push) * calm + air;
    s.omega += (-stiffness * (s.theta - target) - damping * s.omega) * dt;
    s.theta += s.omega * dt;
    if (Math.abs(s.theta) > max) {
      s.theta = clamp(s.theta, -max, max);
      s.omega *= -0.3;
    }
    s.push *= Math.exp(-dt * 5);
    angle.set(s.theta);
    velocity.set(s.omega);
  });

  /** Impulse in deg/s: clicks, flips, colour swaps. */
  const kick = useCallback((degPerSec: number) => {
    sim.current.omega += degPerSec * (reduced ? 0.25 : 1);
  }, [reduced]);

  /** Sustained push in degrees that decays: cursor brushing past. */
  const nudge = useCallback((deg: number) => {
    const m = (opts.current.max ?? 14) * 0.8;
    sim.current.push = clamp(sim.current.push + deg, -m, m);
  }, []);

  return { angle, velocity, kick, nudge };
}
