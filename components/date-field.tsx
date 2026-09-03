import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type Props = {
  value: string; // 'yyyy-MM-dd'
  onChange: (value: string) => void;
};

// Native-only — see date-field.web.tsx for the web counterpart.
// @react-native-community/datetimepicker has no web implementation.
export function DateField({ value, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) onChange(format(selectedDate, 'yyyy-MM-dd'));
  };

  return (
    <>
      <Pressable style={styles.input} onPress={() => setShowPicker(true)}>
        <ThemedText>{format(parseISO(value), 'd MMMM yyyy', { locale: tr })}</ThemedText>
      </Pressable>
      {showPicker && <DateTimePicker value={parseISO(value)} mode="date" display="default" onChange={handleChange} />}
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#D0D2D8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
