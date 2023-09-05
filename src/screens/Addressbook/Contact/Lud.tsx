import { ZapIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { mainColors } from '@styles'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function Lud({ lud16, lud06, onPress }: { lud16?: string, lud06?: string, onPress: (url: string) => void }) {
	// TODO add zaps: `lightning:${paymentRequest}`
	return (
		<>
			{lud16 || lud06 ?
				<View style={styles.infoWrap}>
					<View style={styles.iconWrap}>
						<ZapIcon width={22} height={22} color={mainColors.WHITE} />
					</View>
					<TouchableOpacity style={{flex:1 ,flexGrow:1 }} onPress={() => onPress('lightning://')}>
						<Txt
							txt={(lud16 || lud06)?.substring(0, 50) || ''}
							styles={[{ color: mainColors.WHITE, paddingBottom: 3 }]}
						/>
					</TouchableOpacity>
				</View>
				:
				null}
		</>
	)
}

const styles = StyleSheet.create({
	infoWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconWrap: {
		minWidth: 25,
		marginTop: 3
	}
})