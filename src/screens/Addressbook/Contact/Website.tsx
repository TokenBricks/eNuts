import { LinkIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { useThemeContext } from '@src/context/Theme'
import { mainColors } from '@styles'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function Website({ website, onPress }: { website?: string, onPress: (url: string) => void }) {
	const { highlight } = useThemeContext()
	const site = website?.includes('://') ? website.split('://')[1] : website
	const navSite = website?.includes('://') ? website : `https://${website}`
	return (
		site?.length ?
			<View style={styles.infoWrap}>
				<View style={styles.iconWrap}>
					<LinkIcon width={20} height={20} color={mainColors.WHITE} />
				</View>
				<TouchableOpacity onPress={() => onPress(navSite || '')}>
					<Txt txt={site} styles={[{ color: mainColors.WHITE, paddingBottom: 3 }]} />
				</TouchableOpacity>
			</View>
			:
			null
	)
}

const styles = StyleSheet.create({
	infoWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconWrap: {
		minWidth: 25,
	}
})