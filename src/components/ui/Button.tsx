import Loading from '@comps/Loading'
import { useThemeContext } from '@src/context/Theme'
import { highlight as hi, mainColors } from '@styles'
import {
	StyleProp,
	StyleSheet,
	Text,
	TouchableOpacity,
	ViewStyle,
} from 'react-native'

interface IButtonProps {
  txt: string;
  onPress: () => void;
  border?: boolean;
  outlined?: boolean;
  filled?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  styles?: StyleProp<ViewStyle>;
}

export default function Button({
	txt,
	onPress,
	border,
	outlined,
	filled,
	disabled,
	loading,
	icon,
	styles : customStyles,
}: IButtonProps) {
	const { highlight } = useThemeContext()
	return (
		<TouchableOpacity
			accessibilityRole="button"
			activeOpacity={0.5}
			disabled={disabled}
			style={[
				styles.touchableOpacity,
				{ backgroundColor: hi[highlight], padding: 20 },
				border ? { borderWidth: 1, borderColor: mainColors.WHITE } : {},
				filled ? { backgroundColor: mainColors.WHITE } : {},
				outlined
					? {
						backgroundColor: 'transparent',
						padding: 18,
						borderWidth: 1,
						borderColor: hi[highlight],
					}
					: {},
				disabled ? { opacity: 0.3 } : {},
				customStyles,
			]}
			onPress={onPress}>
			<Text
				style={[
					styles.btnTxt,
					filled || outlined ? { color: hi[highlight] } : {},
					loading || icon ? { marginRight: 10 } : {},
				]}>
				{txt}
			</Text>
			{loading && <Loading color={mainColors.WHITE} />}
			{!loading ? icon : null}
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	touchableOpacity: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 50,
	},
	btnTxt: {
		color: mainColors.BLACK,
		textAlign: 'center',
		fontSize: 16,
		fontWeight: '500',
	},
})
