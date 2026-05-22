import { Switch } from '@ha/Switch';
import { IMQTTConnection } from '@mqtt/IMQTTConnection';
import { buildEntityConfig } from 'Sleeptracker/buildEntityConfig';
import { sendAdjustableBaseCommand } from '../requests/sendAdjustableBaseCommand';
import { Bed } from '../types/Bed';
import { Commands } from '../types/Commands';
import { Controller } from '../types/Controller';
import { Snapshot } from '../types/Snapshot';

export const processSafetyLightSwitches = async (
  mqtt: IMQTTConnection,
  { deviceData }: Bed,
  { sideName, entities, user }: Controller,
  { side, safetyLightOn }: Snapshot
) => {
  const cache = entities as { safetyLightSwitch?: Switch; lastSafetyLightOn?: boolean };
  if (typeof safetyLightOn === 'boolean') cache.lastSafetyLightOn = safetyLightOn;
  if (!cache.safetyLightSwitch) {
    cache.safetyLightSwitch = new Switch(
      mqtt,
      deviceData,
      buildEntityConfig('Safety Lights', sideName),
      async (state: boolean) => {
        if (cache.lastSafetyLightOn != state) {
          const results = await sendAdjustableBaseCommand(Commands.ToggleSafetyLights, user);
          const snapshot = results.find((r) => r.side === side);
          if (snapshot && typeof snapshot.safetyLightOn === 'boolean') {
            cache.lastSafetyLightOn = snapshot.safetyLightOn;
          }
        }
        return state;
      }
    );
  }
  cache.safetyLightSwitch.setOnline();
  if (typeof safetyLightOn === 'boolean') {
    cache.safetyLightSwitch.setState(safetyLightOn);
  }
};
