import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: string; // 'yyyy-MM-dd'
  onChange: (value: string) => void;
};

// Web counterpart to date-field.tsx — @react-native-community/datetimepicker
// has no web implementation, so this uses the browser's native date input.
export function DateField({ value, onChange }: Props) {
  const theme = useTheme();

  return (
    <input
      type="date"
      value={value}
      onChange={(e) => e.target.value && onChange(e.target.value)}
      style={{
        borderWidth: 1,
        borderColor: '#D0D2D8',
        borderRadius: 12,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 12,
        paddingBottom: 12,
        fontSize: 16,
        color: theme.text,
        background: 'transparent',
        fontFamily: 'inherit',
      }}
    />
  );
}
