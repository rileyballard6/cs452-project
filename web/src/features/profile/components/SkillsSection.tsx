import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { userService } from '../../../services/user.service';
import type { Skill } from '../../../types/portfolio.types';

const CATEGORIES = ['language', 'framework', 'tool', 'other'] as const;

export function SkillsSection({ refreshKey }: { refreshKey: number }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('language');

  useEffect(() => {
    userService.getSkills().then(setSkills).catch(() => {});
  }, [refreshKey]);

  async function handleAdd() {
    if (!newName.trim()) return;
    const created = await userService.createSkill({ name: newName.trim(), category: newCategory });
    setSkills(prev => [...prev, created]);
    setNewName('');
  }

  async function handleDelete(id: string) {
    await userService.deleteSkill(id);
    setSkills(prev => prev.filter(s => s.id !== id));
  }

  const byCategory = skills.reduce<Record<string, Skill[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  return (
    <section className="mt-10 mb-10">
      <p className="mb-5 text-xs font-medium uppercase tracking-wider text-gray-400">Skills</p>

      {Object.keys(byCategory).length === 0 && (
        <p className="mb-3 text-sm text-gray-300">No skills added yet.</p>
      )}

      <div className="space-y-3">
        {Object.entries(byCategory).map(([cat, items]) => (
          <div key={cat} className="flex items-baseline gap-3">
            <p className="w-20 shrink-0 text-xs capitalize text-gray-400">{cat}</p>
            <div className="flex flex-wrap gap-1.5">
              {items.map(s => (
                <span key={s.id} className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                  {s.name}
                  <button onClick={() => handleDelete(s.id)} className="cursor-pointer text-gray-300 hover:text-red-400"><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add skill…"
          className="w-36 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-gray-400 placeholder:text-gray-300"
        />
        <select
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600 outline-none focus:border-gray-400"
        >
          {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        <button onClick={handleAdd} className="flex cursor-pointer items-center gap-1 text-xs text-gray-400 hover:opacity-70">
          <Plus size={12} />Add
        </button>
      </div>
    </section>
  );
}
