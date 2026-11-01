import React, { useId } from 'react';
import { characterCount, type ExecutionMode } from './taskModel';
import './taskExperience.css';

// Production mapping: el-input(type=textarea, show-word-limit) + existing execution controls.
export const WebTaskRemark = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const id = useId();
  return <div className="task-remark"><label htmlFor={id}>任务备注 <span>选填</span></label><div><textarea id={id} aria-describedby={`${id}-count`} value={value} onChange={event => onChange(Array.from(event.target.value).slice(0, 100).join(''))} rows={2} placeholder="记录本次任务的用途或注意事项" /><small id={`${id}-count`}>{characterCount(value)}/100</small></div></div>;
};

export const WebTaskTiming = ({ mode, onModeChange, at, onAtChange }: { mode: ExecutionMode; onModeChange: (mode: ExecutionMode) => void; at: string; onAtChange: (at: string) => void }) => {
  const name = useId();
  return <fieldset className="task-timing"><legend>执行方式</legend><div>{([['now', '立即执行'], ['manual', '手动执行'], ['scheduled', '定时执行']] as const).map(([value, label]) => <label key={value}><input type="radio" name={name} checked={mode === value} onChange={() => onModeChange(value)} />{label}</label>)}</div>{mode === 'scheduled' && <label className="task-date">计划执行时间<input aria-label="计划执行时间" type="datetime-local" value={at} onChange={event => onAtChange(event.target.value)} /></label>}</fieldset>;
};
