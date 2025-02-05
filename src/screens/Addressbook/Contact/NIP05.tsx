import { VerifiedIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { nip05toWebsite } from '@nostr/util'
import { useThemeContext } from '@src/context/Theme'
import { highlight as hi, mainColors } from '@styles'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function NIP05Verified({ nip05, onPress }: { nip05?: string, onPress: (url: string) => void }) {
	const { highlight } = useThemeContext()
	return nip05 && nip05.split?.('@').length > 1 ?
		<View style={styles.infoWrap}>
			<View style={styles.iconWrap}>
				<VerifiedIcon width={18} height={18} color={mainColors.WHITE} />
			</View>
			<TouchableOpacity onPress={() => onPress(nip05toWebsite(nip05))}>
				<Txt
					txt={nip05.split('@')[0] === '_' ? nip05.split('@')[1] : nip05}
					styles={[{ color: mainColors.WHITE, paddingBottom: 3 }]}
				/>
			</TouchableOpacity>
		</View>
		:
		null
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