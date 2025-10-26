'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import Card from '@/components/ui/card';
import SectionContainer from '@/components/ui/section-container';
import { Input } from '@/components/catalyst/input';
import { Fieldset, FieldGroup, Field, Label, Legend } from '@/components/catalyst/fieldset';
import { Button } from '@/components/catalyst/button';
import { Text } from '@/components/catalyst/text';
import { Divider } from '@/components/catalyst/divider';
import { authClient } from '@/lib/auth-client';

import SettingsNavbar from './settings-navbar';

export default function SettingsPage() {
  const user = useQuery(api.auth.getCurrentUserSafe);

  const currentName = user?.name ?? 'Anonymous';
  const [name, setName] = useState(currentName);

  const handleNameSave = async () => {
    await authClient.updateUser({ name });
  };

  const currentEmail = user?.email ?? '';
  const [email, setEmail] = useState(currentEmail);

  const handleEmailSave = async () => {
    await authClient.changeEmail({ newEmail: email });
  };

  return (
    <>
      <SettingsNavbar />
      <main className="mx-auto max-w-prose flex-1 overflow-y-auto px-4 pt-[4.25rem]">
        <SectionContainer showBottomBorder>
          <Card>
            <form onSubmit={(e) => e.preventDefault()}>
              <Fieldset>
                <Legend>Profile information</Legend>
                <Text>Update your name, email, and password.</Text>
                <FieldGroup>
                  <div className="flex items-end gap-2">
                    <Field className="flex-1">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        autoComplete="given-name"
                        inputMode="text"
                        defaultValue={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </Field>
                    <Button color="rose" type="button" onClick={handleNameSave} disabled={name === currentName}>
                      Save
                    </Button>
                  </div>
                  <Divider />
                  <div className="flex items-end gap-2">
                    <Field className="flex-1">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        name="email"
                        autoComplete="email"
                        inputMode="text"
                        defaultValue={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Field>
                    <Button color="rose" type="button" onClick={handleEmailSave} disabled={email === currentEmail}>
                      Save
                    </Button>
                  </div>
                  <Divider />
                </FieldGroup>
              </Fieldset>
            </form>
          </Card>
        </SectionContainer>
        <SectionContainer showBottomBorder>
          <Card>This is card text.</Card>
        </SectionContainer>
        <SectionContainer showBottomBorder>
          <Card>This is card text.</Card>
        </SectionContainer>
      </main>
    </>
  );
}
