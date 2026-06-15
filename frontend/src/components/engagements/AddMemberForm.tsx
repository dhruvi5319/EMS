import { useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface UserResult {
  id: string;
  display_name: string;
  email: string;
  roles: string[];
}

const ROLES = [
  { value: 'AL', label: 'AL — Audit Lead' },
  { value: 'EM', label: 'EM — Engagement Manager' },
  { value: 'AN', label: 'AN — Analyst' },
  { value: 'QA', label: 'QA — QA Reviewer' },
  { value: 'IR', label: 'IR — Independent Reviewer' },
  { value: 'PC', label: 'PC — Project Coordinator' },
  { value: 'RO', label: 'RO — Read Only' },
];

interface AddMemberFormProps {
  engagementId: string;
  onAdded: () => void;
  onAddMember: (userId: string, role: string) => Promise<void>;
}

export function AddMemberForm({ onAdded, onAddMember }: AddMemberFormProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(value: string) {
    setQuery(value);
    if (value.length < 2) {
      setUsers([]);
      return;
    }
    const res = await api.get<{ users: UserResult[] }>(
      `/api/users/search?q=${encodeURIComponent(value)}`,
    );
    if (res.ok) setUsers(res.data.users);
  }

  async function handleAdd() {
    if (!selectedUser || !selectedRole) return;
    setSubmitting(true);
    setError('');
    try {
      await onAddMember(selectedUser.id, selectedRole);
      setSelectedUser(null);
      setSelectedRole('');
      setQuery('');
      setUsers([]);
      onAdded();
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e.status === 409) {
        setError('This user already holds this role on the engagement.');
      } else {
        setError(e.message ?? 'Failed to add team member. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 pt-2">
      {/* UserSearchCombobox */}
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Search users
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedUser ? (
                <span className="text-sm">{selectedUser.display_name}</span>
              ) : (
                <span className="text-muted-foreground text-sm">
                  Search by name or email...
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search by name or email..."
                value={query}
                onValueChange={handleSearch}
              />
              <CommandList>
                {users.length === 0 && query.length >= 2 && (
                  <CommandEmpty>No users found.</CommandEmpty>
                )}
                {query.length < 2 && (
                  <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
                )}
                <CommandGroup>
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => {
                        setSelectedUser(user);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedUser?.id === user.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <div>
                        <div className="text-sm">{user.display_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                          {user.roles.length > 0 && ` · ${user.roles.join(', ')}`}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* RoleSelector */}
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Role
        </label>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Add button */}
      <Button
        className="w-full bg-primary text-primary-foreground"
        disabled={!selectedUser || !selectedRole || submitting}
        onClick={handleAdd}
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          'Add to Team'
        )}
      </Button>
    </div>
  );
}
