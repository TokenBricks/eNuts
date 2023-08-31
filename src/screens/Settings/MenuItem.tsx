import { ChevronRightIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface IMenuItemProps {
	txt: string
	txtColor: string
	onPress: () => void
	icon: React.ReactElement
	hasSeparator?: boolean
	hasChevron?: boolean
}


export default function SettingsMenuItem({ txt, txtColor, icon, onPress, hasSeparator, hasChevron }: IMenuItemProps) {
	return (
		<>
			<TouchableOpacity
				style={styles.settingsRow}
				onPress={onPress}
			>
				<View style={styles.setting}>
					<View style={styles.settingIcon}>
						{icon}
					</View>
					<Text style={[styles.settingTxt, { color: txtColor }]}>
						{txt}
					</Text>
				</View>
				{hasChevron &&
					<ChevronRightIcon color={txtColor} />
				}
			</TouchableOpacity>
			{/* {hasSeparator && <Separator style={[{ marginVertical: 10 }]} />} */}
		</>
	)
}

const styles = StyleSheet.create({
	settingsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 12,
	},
	setting: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	settingTxt: {
		marginLeft: 15,
		fontSize: 16,
	},
	settingIcon: {
		backgroundColor: 'rgba(0,0,0,0.03)',
		borderRadius: 999,
		padding: 10,
	},
})